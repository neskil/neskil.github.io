// The Forest From a Drop: a country of mocha-ware pots as big as hills. A dark drop lands on wet blue slip and a
// tree branches out of it; one house-sized drop grows a tree as tall as a mountain while we fly through its crown.
// Everything visible is made from ONE makeStyle instance (src/parts/forest-from-a-drop.js): glaze, stain, drop, sky.
// World coordinates are the Great Jar's own (its base centre is the origin, the tree is on its +Z face).
// REPAIR 3 (the same course, pace, gaze and timing, untouched; cures of things that were staged for a clock or a place of the
// pictures): the nine near pots' slip fronts start from each pot's own seeded phase on the world's clock, as every pot's do
// (makePot; the typed pose 12 s into the clock is gone); the first valley's large drops are a shower of the place in three or four
// curtains (buildValleyRain) instead of nine columns hung from one point of the course; nothing flowers before the strike: the
// Bowl's wreath stands bare, and the Bowl's honey floor carries the ware's slip marks (buildBloom).
// POLISH 6 (the same course; what strangers still missed was colour and richness in the first third, a bloom that came late and thin,
// and an exit that did not glow): every pot carries the ware's other marks on its cream shoulder (a rust line, a row of cat's eyes, an
// earthworm cable: the glaze shader); the sky is feathered slip (combed bands of pale blue and honey); two old earthworm trails wind
// down the first valley; the wreath inside the Bowl flowers on the clock (the first blossom, by 0.08); the grove's bloom is two thirds
// denser, with petals tumbling through the air and the whole ware warming; the shower's small trees round the lug flower; the
// portal's film is a bright cream-gold disc.
// POLISH 5 (the course): it enters on the Pitcher, climbs over the Bowl's wreath (0.16) and looks down the valley from
// above (0.25), dives among the pots while the great drop falls in front of the old frieze (0.34), sees the strike from 280 m (0.39)
// and the trunk go up (0.43); then flies EAST through the grove that stands up out of the burst of slip while it comes into FLOWER:
// cat's eyes (the ware's three-coloured slip dots) open along the twigs in a wave that runs ahead of us, an earthworm trail of three
// slips is laid on the tray under the course, and behind the blossom the flood turns from blue to marbled honey; it rounds the far
// end of the grove (the lug in view across the bloom from 0.66) and comes back WEST down the flowering avenue to the lug.
// POLISH 3 (the course before that, kept for the record; the paragraph after this one is the course as polish 2 left it): it enters on the
// Pitcher, crosses the Bowl's wreath by u 0.16, comes down the valley while the great drop (60 m, with a tail) falls and strikes at 0.39,
// sees the trunk go up the whole band and a sheet of blue slip burst out over the tray, flies east through the forest that stands up out
// of that slip, turns back round its far end and comes in to the lug (2.2 times the size, facing the valley) heading west. The pots stand
// on a tray of the same ware whose rim is the horizon; honey pools dark under every pot; some pots are in the ware's other colourways.
// The flight (polish 2: twelve different pictures, the valley 950 m deep): it enters looking at the whole Pitcher (its 60 m tree
// and the window beside it), swings right past its flank and over the Bowl, whose inside carries blue slip too and a wreath of
// trees round a honey pool; runs down the valley at the Great Jar from 630 m while the great drop (38 m) falls among the pots
// (u 0.335-0.46); comes in low among their feet as the trunk goes up the whole band and the window lies beside it; passes under
// the tree while a wave goes out along the band and the drowned frieze grows again as a forest (0.52 on); skims the foot of the
// band along that avenue; and comes to the lug (now at mid-band) from the valley side, level, the pots beyond it.
// Seeded: hour (day/golden/dawn/night), colourway (blue/tan/grey-green belly), the dendrite's habit (upright/seaweed/fern),
// showers by density. Rare: a second great drop beyond the lug.
// Clock: a slip front goes round every pot each LAP seconds; frieze trees are wiped where its wet edge is and regrow right
// behind it. On the Pitcher the front lingers on the side the entry and first leg see (style.glaze({ lap })), so a wet edge is always in view.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle } from '../parts/forest-from-a-drop.js';

const TAU = Math.PI * 2;
const BOWL = { x: -110, z: 1300, H: 120 };      // (polish 2) the Bowl: flown over, its inside a ring of blue slip with a wreath of trees
const BASE = ['#EFE3C4', '#C9A45A', '#6F8FA6', '#C99A5B', '#8C8A4A', '#4A2E20', '#2B1D1A'];
const hexMul = (hex, r, g, b) => { const c = new THREE.Color(hex); c.r = clamp(c.r * r, 0, 1); c.g = clamp(c.g * g, 0, 1); c.b = clamp(c.b * b, 0, 1); return '#' + c.getHexString(); };
// the flight's clock, as fractions of the path (the hero's great drop and tree hang on these)
// (polish 3) the great drop falls while we come down the valley (0.26-0.41), strikes with the Jar and its neighbours one picture, and the
// tree is up the whole band by 0.455; the rest of the flight goes round the forest that stands up out of the burst of slip
const TIMING = { wet: 0.1, fall: 0.28, strike: 0.39, trunk: 0.42, limbs: 0.53, end: 0.985 };
// the Jar's slip front (u, metres along its band): it wipes the old frieze across the picture while we round the Pitcher and fly in
const FRONT = [[0.1, -470], [0.2, -330], [0.3, -150], [0.36, -30], [0.39, 70], [0.45, 330], [0.5, 560], [0.55, 735]];   // (polish 5) slower: while the drop falls the old frieze still stands right of it
const LUG = { x: 232, y: 108, scale: 2.2 };      // (polish 3) the lug: 2.2 times the size, east of the crown, its hole turned to face the valley
const PC = [-430, 1340], PR = 110;            // the Pitcher: centre (x, z) and belly radius
const HANDLE_A = 125 * Math.PI / 180;           // where its handle stands (pot angle, 0 = +Z growing toward +X)
const EYE_STEP = 2.5;                           // (repair 3) metres of route between the eyes a margin or a nearest approach is tested from

// move a lathe/strap geometry made in pot space into the world (a pot never turns: translation only)
// (polish 3: straight into the array; geometry.translate() cost the build 27 ms)
function place(geo, x, z, y = 0) {
  const a = geo.attributes.position.array;
  for (let i = 0; i < a.length; i += 3) { a[i] += x; a[i + 1] += y; a[i + 2] += z; }
  if (geo.boundingSphere) geo.boundingSphere.center.add(new THREE.Vector3(x, y, z));
  if (geo.boundingBox) geo.boundingBox.translate(new THREE.Vector3(x, y, z));
  return geo;
}

export default {
  id: 'forest-from-a-drop',
  name: 'The Forest From a Drop',
  category: 'alien',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1, rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ---------------------------------------------------------------- the seeded look (all draws up front)
    const vr = rng.fork('look');
    const hourPick = vr.pick(['golden', 'day', 'day', 'day', 'day', 'dawn', 'night', 'golden']);
    const hour = (vary.hour && vary.hour !== 'any') ? vary.hour : hourPick;
    const ci = Math.floor(vr() * 8), hi = Math.floor(vr() * 8);
    const colourway = ['blue', 'tan', 'green', 'blue', 'blue', 'green', 'tan', 'blue'][(ci + hi) % 8];
    const habit = ['upright', 'upright', 'seaweed', 'fern', 'upright', 'seaweed', 'fern', 'upright'][hi];
    const P = BASE.slice(); let rust = '#8A4A2A', win = '#FFF8E6', winSize = 1, pale = 0.55;
    if (colourway === 'tan') { P[2] = '#C4925A'; P[3] = '#6F8FA6'; P[4] = '#7F8548'; P[6] = '#1F3550'; rust = '#4F6E8C'; }
    else if (colourway === 'green') { P[2] = '#8FA690'; P[3] = '#C99A5B'; P[6] = '#7A2F2B'; rust = '#C07A6C'; }
    if (hour === 'golden') { P[0] = '#E6CF9A'; P[1] = '#B8873A'; win = '#FFD98A'; for (const i of [2, 3, 4]) P[i] = hexMul(P[i], 1.02, 0.94, 0.8); }
    else if (hour === 'night') { P[0] = '#B7B5A6'; P[1] = '#7F7B63'; win = '#E2ECFF'; winSize = 0.62; pale = 0.4;
      for (const i of [2, 3, 4, 5]) P[i] = hexMul(P[i], 0.52, 0.58, 0.72); P[6] = hexMul(P[6], 0.6, 0.6, 0.75); rust = hexMul(rust, 0.6, 0.6, 0.7); }
    else if (hour === 'dawn') { P[0] = '#F1DFCB'; P[1] = '#CF9F74'; win = '#FFC4BC'; }
    const style = makeStyle(ctx, { palette: P, rust, window: win, pale: pale * 0.8, orange: hour === 'night' ? '#7E4A36' : '#CC5A22', dark: hour === 'night' ? '#2A1A16' : '#43281C' });
    // (polish 3) the same ware in its other two colourways, for pots here and there across the valley: [belly, tan, olive, ink, rust]
    const CW = { blue: ['#6F8FA6', '#C99A5B', '#8C8A4A', '#2B1D1A', '#8A4A2A'], tan: ['#C4925A', '#6F8FA6', '#7F8548', '#1F3550', '#4F6E8C'], green: ['#8FA690', '#C99A5B', '#8C8A4A', '#7A2F2B', '#C07A6C'] };
    const hm = (h, i) => (hour === 'golden' && i < 3 ? hexMul(h, 1.02, 0.94, 0.8) : hour === 'night' ? (i < 3 ? hexMul(h, 0.52, 0.58, 0.72) : i === 3 ? hexMul(h, 0.6, 0.6, 0.75) : hexMul(h, 0.6, 0.6, 0.7)) : h);
    const altSets = Object.keys(CW).filter((k) => k !== colourway).map((k) => { const c = CW[k].map((h, i) => ({ value: new THREE.Color(hm(h, i)) })); return { uBlue: c[0], uTan: c[1], uOlive: c[2], uInk: c[3], uRust: c[4] }; });
    style.uniforms.uWinSize.value.multiplyScalar(winSize * 0.8);
    const pal = style.palette;
    await ctx.yield();

    // ---------------------------------------------------------------- the hero: the Great Jar, its tree, the lug
    const hero = await buildHero(ctx, { style, detail, habit, timing: TIMING, front: FRONT, palette: P, dropRadius: 30, fallHeight: 330, dropTail: 1, blot: 0.6, trunkHw: 6.6,
      lugX: LUG.x, lugY: LUG.y, lugScale: LUG.scale, lugDir: -1, lugYaw: 0.6, lugPitch: 0.0, aim: false, feather: false, orders: 4, fine: 0.38 });      // (polish 3) never nearer than 100 m now: no hair twigs, no limbs laid along a climb      // (polish 2) the lug at mid-band: we come to it level, the valley beyond it
    scene.add(hero.object);
    const A = hero.anchors;
    // (polish 1) the window stands low and to the left of the run-in, so on the Jar its one highlight lies whole on the blue band
    // beside the tree all the way in from the valley and is behind us on the climb (it was a torn pane at the cog border)
    style.setWindow(new THREE.Vector3(Math.sin(-0.78) * Math.cos(0.38), Math.sin(0.38), Math.cos(-0.78) * Math.cos(0.38)));
    style.setHeroWindow(new THREE.Vector3(Math.sin(-0.62) * Math.cos(0.2), Math.sin(0.2), Math.cos(-0.62) * Math.cos(0.2)));   // (polish 2) the Jar's share of it: whole on the band beside the tree
    await ctx.yield();

    // ---------------------------------------------------------------- the course
    // level toward the Pitcher's flank (its 60 m tree dead ahead), right along its band, left under the handle,
    // straight at the strike point, then right along the Jar's wall and up through the crown to the lug
    // (the crossing dips to the trunk's mid-height so the strike and the rising trunk sit in frame, then swoops up into the climb)
    // POLISH 1 (the outside eye): the course flies the middle of the valley. It enters looking at the whole Pitcher (its 60 m
    // tree in the middle of the picture, the Jar's banded wall and its old frieze behind), swings round the Pitcher's handle
    // side 80 m and more off, then runs straight in at the Great Jar from half a kilometre out, so the great drop's fall, the
    // strike and the tree going up the whole wall are one picture with pots round it; only the last eighth is close to the
    // wall, up through the crown to the lug with the valley open on the right.
    const W = (x, y, o) => hero.wallPoint(x, y, o);
    // POLISH 2 (the outside eye, again): twelve different pictures. Entry on the whole Pitcher; right, over the Bowl, looking down
    // into its ring of trees; down the open valley from 630 m while the great drop falls among the pots; low among their feet as the
    // trunk goes up; up past the Bottle's neck as the crown spreads and a forest comes up along the band; in to the lug from the
    // valley side (22 degrees to the wall, never along it), the loop and its portal against the blue.
    // POLISH 3 (the outside eye, third time): the Bowl's wreath comes by 0.16; the great drop (60 m, a drop with a tail) falls while we
    // come down the valley and strikes at 0.41 with the Jar and its neighbours one picture; a sheet of blue slip bursts out over the
    // tray from the strike and a forest stands up out of it; the course swings east through that forest 240 m off the wall, turns
    // back round its far end and comes in to the lug (2.2 times the size, its hole facing the valley) heading west, the grown
    // tree behind it. Twelve stills, twelve pictures.
    const seat = A.portalSeat, dIn = seat.direction.clone(), C = seat.position;
    const back = (d) => C.clone().addScaledVector(dIn, -d);
    // POLISH 5 (strangers, fourth time): up and over the Bowl (the wreath by 0.16, the valley seen from above at 0.25 with the rim under
    // us), a dive among the pots while the great drop falls (0.34), the strike from 300 m (0.39); then EAST through the grove as it
    // stands up and flowers (0.43-0.61), round its far end (0.66-0.74, the lug coming into view across the bloom) and back WEST down
    // the flowering avenue, the earthworm trail under us, to the lug.
    const path = makePath([[-430, 185, 1650], [-412, 185, 1585], [-335, 190, 1510], [-262, 200, 1445], [-175, 216, 1360], [-112, 236, 1258], [-86, 170, 1135], [-68, 98, 1040],
      [-10, 68, 985], [90, 64, 1000], [220, 70, 1035], [350, 80, 1060], [480, 90, 1070], [600, 100, 1050], [700, 106, 975], [722, 108, 880], back(440), back(300), back(215), back(150), back(75), C.clone()]);
    const duration = 50;
    // quick down the open valley, lingering while the drop strikes and the tree goes up, easy through the forest, unhurried into the lug
    const pace = (u) => 1.25 - 0.5 * smoothstep(0.33, 0.38, u) * (1 - smoothstep(0.44, 0.5, u)) - 0.1 * smoothstep(0.5, 0.56, u) + 0.1 * smoothstep(0.64, 0.7, u) * (1 - smoothstep(0.76, 0.84, u)) - 0.15 * smoothstep(0.86, 0.92, u);

    // ---------------------------------------------------------------- sky and floor: the same ware
    const sky = style.makeSky(4200); scene.add(sky);
    const pots = [];                               // { x, z, foot, R, H } of everything that stands on the floor
    pots.push({ x: 0, z: 0, foot: 684, R: 700, H: 900 }, { x: PC[0], z: PC[1], foot: 74, R: PR, H: 300 });

    // (repair 3) the course as eyes every EYE_STEP metres of ROUTE (in plan): every nearest approach and keep-out margin this round adds reads these
    const eyeXZ = new Float32Array((Math.floor(path.length / EYE_STEP) + 1) * 2);
    { const v = new THREE.Vector3(); for (let i = 0; i < eyeXZ.length / 2; i++) { path.posAtDist(i * EYE_STEP, v); eyeXZ[i * 2] = v.x; eyeXZ[i * 2 + 1] = v.z; } }
    const courseDist = (x, z) => { let b = 1e12; for (let i = 0; i < eyeXZ.length; i += 2) { const dx = eyeXZ[i] - x, dz = eyeXZ[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const state = { scene, style, hero, path, pots, pal, detail, density, rare, habit, hour, rng, altSets, eyeXZ, courseDist, nearPots: [], straps: [], updaters: [], disposables: [], eyes: [] };
    await buildPitcher(ctx, state);
    await ctx.yield();
    await buildJarFrieze(ctx, state);
    await ctx.yield();
    await buildLesser(ctx, state);
    await ctx.yield();
    await buildGrove(ctx, state);
    await ctx.yield();
    await buildBloom(ctx, state);
    await ctx.yield();
    await buildFloor(ctx, state);
    await ctx.yield();
    await buildDrops(ctx, state);
    await ctx.yield();
    await buildValleyRain(ctx, state);
    await ctx.yield();
    await buildSecond(ctx, state);
    await ctx.yield();

    const tone = { b0: pal.blue.clone(), b1: pal.blue.clone().multiply(new THREE.Color(0.8, 0.91, 1.03)), h0: pal.honey.clone(), h1: pal.honey.clone().multiply(new THREE.Color(1.1, 0.96, 0.6)),
      c0: pal.cream.clone(), c1: pal.cream.clone().multiply(new THREE.Color(1.0, 0.955, 0.8)) };      // (polish 6) the whole ware warms as the grove flowers
    for (const c of [tone.b1, tone.h1, tone.c1]) { c.r = Math.min(c.r, 1); c.g = Math.min(c.g, 1); c.b = Math.min(c.b, 1); }
    const _cp = new THREE.Vector3(), _f = new THREE.Vector3(), _g = new THREE.Vector3(), _l = new THREE.Vector3(), seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
    // the gaze follows the great drop down, then the trunk up, then goes into the crown
    const focus = (time, u) => {
      // falling: a little under the drop, so the band's foot, the lower slips and the floor come into the bottom of the frame;
      // struck: up the trunk as it rises, holding the limbs' height while they fork; then into the crown
      // from the valley the whole band is in frame: the gaze rests on its middle while the drop falls and the trunk goes up,
      // then drifts up and along into the crown toward the lug
      // (polish 3) level over the Bowl, then down with the great drop to the strike, up the trunk as it rises; from 0.55 it goes
      // along the band to the forest between the tree and the lug
      // (polish 5) from over the Bowl the gaze goes DOWN the valley to the foot of the band (pots, pooled tray, the band; little
      // shoulder), stays with the drop to the strike, goes up the trunk; then east: across the rising grove to the wall and the
      // lug (0.52), then ahead into the bloom as its wave runs away from us (0.61)
      // (the gaze is up on the shoulder before the drop comes out of the cream there at 0.28, so the drop is never cut by the frame's top)
      const y = 40 + 260 * smoothstep(0.252, 0.285, u) - 220 * smoothstep(0.3, 0.39, u) + 70 * smoothstep(0.4, 0.45, u);
      hero.wallPoint(-30 * smoothstep(0.27, 0.34, u) * (1 - smoothstep(0.39, 0.43, u)), y, 0, _f);
      if (u > 0.45) { _f.lerp(_g.set(120, 105, 700), smoothstep(0.45, 0.52, u)); _f.lerp(_g.set(700, 85, 760), smoothstep(0.53, 0.61, u)); }
      return _f;
    };
    return {
      scene, path, duration, pace,
      camera: { fov: 56, near: 0.5, far: 6000, lookAhead: 30, sway: 0.5, bank: 0.3 },
      pois: [
        { at: [PC[0] + 110 * Math.sin(0.55), 150, PC[1] + 110 * Math.cos(0.55)], from: 0.02, to: 0.085, weight: 0.2 },   // the Pitcher's tall frieze as we pass it
        { at: [BOWL.x + 10, 45, BOWL.z - 10], from: 0.06, to: 0.235, weight: 0.75, fade: 0.25 },                 // down into the Bowl as we come over its rim
        { at: focus, from: 0.2, to: 0.67, weight: 0.8, fade: 0.1 },
        { at: (time, u) => _l.copy(seat.position).setY(lerp(15, seat.position.y, smoothstep(0.74, 0.9, u))), from: 0.62, to: 0.985, weight: 0.7, fade: 0.2 },      // (polish 5) the lug is the destination from the turn on
      ],
      portal: { shape: 'circle', radius: seat.radius * 1.2, tilt: true, color: new THREE.Color(1.9, 1.5, 0.82), glow: 0.6, revealDistance: 420 },
      post: style.post,
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        style.update(dt, time, camera);
        style.uniforms.uTime.value = time * 24 / LAP;      // the style's clock: a slip front every LAP seconds
        hero.setProgress(u);
        style.heroWindow.value = smoothstep(0.37, 0.42, u) * (1 - smoothstep(0.55, 0.6, u));
        // (polish 3) the burst of slip runs out over the tray from the strike; as the forest stands up the blue deepens and the honey glows
        state.flood.z = 900 * Math.pow(seg(u, TIMING.strike + 0.004, 0.66), 0.6);
        const kc = smoothstep(0.47, 0.66, u);
        pal.blue.copy(tone.b0).lerp(tone.b1, kc); pal.honey.copy(tone.h0).lerp(tone.h1, kc); pal.cream.copy(tone.c0).lerp(tone.c1, kc); style.uniforms.uSkyWarm.value = kc;   // close in, the Jar's highlight would stand half out of the frame: it slides off the band as we turn along the wall
        hero.update(dt, time, camera);
        camera.getWorldPosition(_cp);
        sky.position.copy(_cp);
        for (const f of state.updaters) f(dt, time, camera, u, _cp);
      },
      dispose() { for (const d of state.disposables) d.dispose(); },
    };
  },
};

// ================================================================ trees on a pot's blue band (clock trees)
// pot: the result of style.lathe (pot space); list: [{ a, L, budget }] angle round the pot and tree height.
// Returns the ribbon geometries (pot space) and pushes { root, normal, start, L } into state.trees (pot space too:
// the caller shifts them). Every tree is born behind the slip front, grows in ~3.5 s and is drowned by the next.
async function potTrees(ctx, state, pot, list, rngT, habit) {
  const { style } = state, geos = [], recs = [], F = new Float64Array(6);
  const y0 = pot.edgeAt(3, 0), y1 = pot.edgeAt(4, 0), mpt = y1 - y0, R = pot.R;
  const surf = (x, y, out) => pot.surf(x / R, y, out, 0.1);
  for (let i = 0; i < list.length; i++) {
    const t = list[i], L = Math.min(t.L, mpt * 0.86), x = t.a * R, wide = (habit === 'seaweed' ? 1.15 : 0.62) * (t.wide ?? 1);
    const big = L > 45, orders = t.orders ?? (big ? 4 : L > 18 ? 3 : L > 7 ? 2 : 1);
    const rootY = t.y ?? (Math.max(pot.edgeAt(3, t.a), y0) + mpt * 0.03 + 0.4);
    const br = await style.growDendrite(rngT, {
      x, y: rootY, len: L * (habit === 'seaweed' ? 0.55 : 0.97), hw: Math.max(0.12, L * (t.thin ?? 0.021)), heading: rngT.range(-0.12, 0.12), orders, habit,
      segs: [Math.max(6, Math.round(L / 2.4)), big ? 14 : 9, 7, 5, 3], kids: [big ? 13 : L > 18 ? 9 : 6, big ? 9 : 6, 5, 3], clear: rngT.range(0.14, 0.24),
      ratio: [rngT.range(0.72, 0.86), 0.7, 0.7, 0.7, 0.7, 0.7], cell: L > 18 ? Math.max(0.35, L / 70) : 0, minHw: Math.max(0.03, L * 0.0012), minLen: L * 0.03,
      bounds: { x0: x - L * wide, x1: x + L * wide, y0: t.y ? t.y - 1 : y0 + mpt * 0.02, y1: y1 - mpt * 0.115 - 0.6 }, budget: t.budget ?? 600, speed: () => 1,
      yield: ctx.yield,
    });
    if (t.y !== undefined && br.length) {              // a tree in mid-band grew from a drop: it stands on the round blot the drop left
      const rb = clamp(2.6 * br[0].pts[2], 0.45, 2.2);
      br.push({ order: 0, n: 2, blot: rb, speed: 1, pts: new Float32Array([x, rootY - 1.4 * rb, 0.1, 0, x, rootY + 1.4 * rb, 0.1, 0]) });
    }
    let maxB = 1;
    for (const b of br) maxB = Math.max(maxB, b.pts[(b.n - 1) * 4 + 3]);
    // the slip front reaches each part of a tree at its own moment (lag, in laps after the root); the drop lands once the whole tree is under
    const lapAt = pot.lapAt || ((a) => (((a / TAU) % 1) + 1) % 1), nL = pot.laps || 1, l0 = lapAt(t.a);
    const lagOf = pot.noLag ? null : (bx) => { const d = lapAt(bx / R) - l0; return ((d + nL * 1.5) % nL) - nL / 2; };
    // no part of the new tree may be drawn before the edge has passed it: lag minus the time growth takes to get there
    const rate = maxB / (t.grow ?? (big ? 6.5 : 5));
    let lagMax = 0;
    if (lagOf) for (const b of br) for (let k = 0; k < b.n; k++) lagMax = Math.max(lagMax, lagOf(b.pts[k * 4]) - b.pts[k * 4 + 3] / (24 * rate));
    const dl = Math.max(Math.round((t.delay ?? 0) * 100), Math.ceil((lagMax - 0.04) * 100)) / 100;   // laps by which its drop comes late
    const start = ((style.treeStart(pot.phase, pot.lapAt ? pot.lapAt(t.a) * TAU : t.a) - dl) % 1 + 1) % 1 * 0.9999 + dl * 100;
    await ctx.yield();
    geos.push(await style.ribbons(br, surf, { start, rate, lag: lagOf, yield: ctx.yield }));
    pot.surf(t.a, rootY, F, 0);
    recs.push({ root: new THREE.Vector3(F[0], F[1], F[2]), normal: new THREE.Vector3(F[3], F[4], F[5]), start: start % 1, L, dl, grow: (t.grow ?? (big ? 6.5 : 5)) });
    await ctx.yield();
  }
  return { geos, recs };
}
// the centre line of a strap handle in the radial plane at pot angle a: pts = [[r, y], ...] from the pot's axis
function handlePoints(a, pts, n = 44) {
  const s = Math.sin(a), c = Math.cos(a);
  return new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(s * r, y, c * r)), false, 'centripetal').getSpacedPoints(n);
}

// ================================================================ the Pitcher: its wet band, its frieze, its handle
async function buildPitcher(ctx, state) {
  const { style, scene, rng } = state, rp = rng.fork('pitcher');
  const phase = rp();
  const pot = await style.lathe({ yield: ctx.yield,
    profile: [[0, 72], [16, 84], [60, 104], [104, PR], [150, 105], [206, 84], [240, 63], [262, 53], [282, 57], [300, 68]],
    edges: [0, 40, 78, 112, 206], a0: -Math.PI, a1: Math.PI, cols: Math.round(186 * (0.7 + 0.3 * state.detail)), rows: [2, 2, 3, 12, 18],
    phase, lean: [rp.range(-0.02, 0.02), rp.range(-0.02, 0.02)], oval: rp.range(0.006, 0.014), slump: { amp: rp.range(9, 16), dir: HANDLE_A + Math.PI + rp.range(-0.4, 0.4) },
  });
  await ctx.yield();
  // the handle: a pulled strap from the shoulder out over the course and back to the belly, pressed on with a thumb
  const hp = handlePoints(HANDLE_A, [[60, 240], [76, 246], [100, 238], [124, 222], [146, 200], [158, 170], [156, 140], [140, 113], [120, 98], [108, 93]]);
  const side = new THREE.Vector3(Math.cos(HANDLE_A), 0, -Math.sin(HANDLE_A));
  const F = new Float64Array(6), V = (i) => new THREE.Vector3(F[i], F[i + 1], F[i + 2]);
  pot.surf(HANDLE_A, 78, F, 0.2); const padC = V(0), padN = V(3);
  pot.surf(HANDLE_A, 246, F, 0.2); const pad2C = V(0), pad2N = V(3);
  const handle = mergeGeometries([
    style.strap({ points: hp, side, width: 9, thick: 4.6, phase }),
    style.thumbPad(padC, padN, new THREE.Vector3(0, 1, 0), 5.2, phase),
    style.thumbPad(pad2C, pad2N, new THREE.Vector3(0, -1, 0), 4.4, phase),
  ]);
  // its slip front lingers where the entry and the first leg look (pot angle -1.45 to 1.25): 24 s to cross that sector at 12 m/s,
  // a front entering every LAP seconds, so one wobbling wet edge is always on the visible band with trees blooming in order behind it
  // The slow sector runs on past the handle to pot angle 2.0 at the same 12 m/s (the same lap time per radian, so the entry's
  // side is exactly as it was): the wall beside the handle is the left of the picture while the great drop falls, and with a slow
  // edge there is always an old tree ahead of it or a regrown one behind it there, never a bare wall.
  const LAPW = [(((-1.45 / TAU) % 1) + 1) % 1, 3.45 / TAU, 1.5 * 3.45 / 2.7];
  pot.laps = Math.ceil(LAPW[2]);
  pot.lapAt = (a) => { const c0 = (((a / TAU - LAPW[0]) % 1) + 1) % 1; return c0 < LAPW[1] ? c0 / LAPW[1] * LAPW[2] : LAPW[2] + (c0 - LAPW[1]) / (1 - LAPW[1]) * (Math.ceil(LAPW[2]) - LAPW[2]); };
  const body = new THREE.Mesh(place(pot.geometry, PC[0], PC[1]), style.glaze({ lap: LAPW, fringe: 0, lead: 0.4 }));      // (polish 3) its wet edge is a quiet line: at arm's length the dark one read as a ragged patch
  const hMesh = new THREE.Mesh(place(handle, PC[0], PC[1]), style.glaze({ side: THREE.DoubleSide }));
  scene.add(body, hMesh);
  state.handle = hp.map((p) => p.clone().add(new THREE.Vector3(PC[0], 0, PC[1])));
  await ctx.yield();
  // the frieze: one 60 m tree where the entry axis meets the band, 30 m trees all the way round
  const list = [{ a: -0.13, L: 62, budget: 2100, grow: 10 }];
  const n = 27, step = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI + (i + 0.5 + rp.range(-0.22, 0.22)) * step, L0 = rp.range(25, 40), dl = [0, 0.1, 0.03, 0.16, 0.06][i % 5];
    if (Math.abs(a + 0.13) < 0.36) continue;
    // beside the first leg the wall is at arm's length and the eye is half way up the band: there the trees stand to the cog border
    // (and on round past the handle, where the wall is the left of the picture while the great drop falls)
    const tall = a > 0.2 && a < 2.15, mid = a > -1.0 && a < -0.52, L = tall ? L0 * 1.5 + 21 : mid ? L0 + 13 : L0;   // and left of the 60 m tree a second rank, so a big tree always stands while another is under the front
    // (past the handle they come up fast and with no delay: that wall is at arm's length and its foot is under the frame, so only a tall tree shows)
    list.push({ a, L, delay: tall && a > 1.22 ? 0 : dl, grow: tall ? (a < 1.22 ? 11 : 4.5) : 9, wide: tall ? 0.42 : 1, thin: tall ? 0.019 : 0.021, budget: Math.round((tall ? 700 : mid ? 480 : 300) * (0.6 + 0.4 * state.detail)) });
  }
  if (list.length > 6) list[5].a = list[6].a - 0.07;       // the hand: two dendrites fuse into a blot
  const { geos, recs } = await potTrees(ctx, state, pot, list, rp, state.habit);
  await ctx.yield();
  // two meshes of one material, so no single merge holds the page
  const stainMat = style.stain(), half = Math.ceil(geos.length / 4);
  let trees = null;
  for (const part of [geos.slice(0, half), geos.slice(half, 2 * half), geos.slice(2 * half, 3 * half), geos.slice(3 * half)]) {
    if (!part.length) continue;
    const tg = place(mergeGeometries(part), PC[0], PC[1]);
    tg.boundingSphere = new THREE.Sphere(new THREE.Vector3(PC[0], 160, PC[1]), 180);
    trees = new THREE.Mesh(tg, stainMat); trees.renderOrder = 3; scene.add(trees);
    await ctx.yield();
  }
  for (const g of geos) g.dispose();
  state.trees = [];
  for (const r of recs) { r.root.x += PC[0]; r.root.z += PC[1]; r.near = true; state.trees.push(r); }
  state.stainMat = trees.material;
}

// ================================================================ the lesser pots: the Bowl, the Bottle, 26 far ones
// profiles as [y / H, r / H]; every pot carries the same slips in the same order, in proportion to itself
const SHAPES = {
  jar: [[0, 0.26], [0.05, 0.3], [0.3, 0.385], [0.5, 0.37], [0.7, 0.28], [0.85, 0.2], [0.93, 0.2], [1, 0.245]],
  jug: [[0, 0.2], [0.06, 0.24], [0.3, 0.325], [0.5, 0.305], [0.68, 0.2], [0.8, 0.15], [0.92, 0.16], [1, 0.205]],
  bottle: [[0, 0.17], [0.05, 0.2], [0.3, 0.225], [0.5, 0.21], [0.62, 0.12], [0.72, 0.055], [0.9, 0.042], [0.97, 0.046], [1, 0.056]],
  flask: [[0, 0.17], [0.05, 0.19], [0.3, 0.2], [0.55, 0.2], [0.68, 0.15], [0.78, 0.075], [0.9, 0.034], [0.97, 0.034], [1, 0.046]],
  bowl: [[0, 0.4], [0.06, 0.5], [0.3, 0.72], [0.6, 0.85], [0.85, 0.91], [1, 0.94]],
  vase: [[0, 0.16], [0.06, 0.2], [0.3, 0.3], [0.5, 0.335], [0.7, 0.22], [0.82, 0.125], [0.94, 0.16], [1, 0.225]],
};
async function makePot(ctx, state, rp, kind, H, x, z, o = {}) {
  const { style } = state, sh = SHAPES[kind], bowl = kind === 'bowl';
  // (repair 3) a pot's phase (the wobble of its bands, where its slip front starts) is its own seeded draw, for every pot alike
  const ph0 = rp(), ph = ph0, lean = [rp.range(-0.03, 0.03), rp.range(-0.03, 0.03)], oval = rp.range(0.004, 0.02), sl = { amp: H * rp.range(0.02, 0.07), dir: rp.range(0, TAU) };
  const pot = await style.lathe({ yield: ctx.yield,
    profile: sh.map(([y, r]) => [y * H, r * H * (o.fat ?? 1)]), edges: (o.edges || [0, 0.12, 0.24, 0.36, 0.61]).map((e) => e * H),
    a0: -Math.PI, a1: Math.PI, cols: o.cols ?? 44, rows: o.rows ?? [1, 1, 1, 5, 9], phase: ph, step: o.step ?? 0.4,
    lean: bowl ? [0, 0] : lean, oval: bowl ? 0.003 : oval, slump: sl,
  });
  const geos = { body: [place(pot.geometry, x, z)], strap: [], tree: [] };
  if (bowl && o.inside) {                           // (polish 2) the great Bowl: blue slip inside too, and a wreath of trees on it
    const ins = await bowlInside(ctx, state, rp, pot.rAt(H), H, pot.phase, sl, o.inside);
    state.bowlRim = pot.rAt(H);
    geos.body.push(place(ins.geo, x, z));
    for (const g of ins.trees) geos.tree.push(place(g, x, z));
    for (const r of ins.recs) { r.root.x += x; r.root.z += z; r.near = true; state.trees.push(r); }
    // (repair 3) the wreath inside the Bowl stands bare: nothing flowers before the strike, and after it the Bowl's inside is never
    // seen again. (Live had cat's eyes opening along its twigs on the clock from the start of the flight.)
  } else if (bowl) geos.body.push(place(innerBowl(pot.rAt(H), H, ph, sl.amp, sl.dir), x, z));
  if (o.handle) {                                   // a strap handle standing off the shoulder as an arch
    const a = o.handle, r1 = pot.rAt(0.8 * H), r2 = pot.rAt(0.4 * H), out = Math.max(r1, r2) + H * 0.2;
    const hp = handlePoints(a, [[r1 - 2, 0.8 * H], [r1 + H * 0.07, 0.84 * H], [out * 0.92, 0.8 * H], [out, 0.66 * H], [out * 0.97, 0.52 * H], [r2 + H * 0.05, 0.42 * H], [r2 - 1, 0.4 * H]], 26);
    geos.strap.push(place(style.strap({ points: hp, side: new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), width: H * 0.045, thick: H * 0.016, cross: 10, phase: pot.phase }), x, z));
    for (const q of hp) state.straps.push({ x: q.x + x, z: q.z + z });      // (repair 3) where its strap stands, in plan: no drop of the valley's shower falls through it
  }
  const n = o.trees ?? 0;
  if (n > 0) {
    const band = 0.25 * H, list = [];
    for (let i = 0; i < n; i++) list.push({ delay: rp.pick([0, 0, 0.12, 0.26]), a: -Math.PI + (i + rp.range(0.1, 0.9)) * TAU / n, L: o.treeL ? rp.range(o.treeL[0], o.treeL[1]) : band * rp.range(0.14, 0.55) * (rp.chance(0.2) ? 1.5 : 1), budget: o.budget ?? 26, orders: o.orders });
    const { geos: tg, recs } = await potTrees(ctx, state, pot, list, rp, state.habit);
    for (const g of tg) geos.tree.push(place(g, x, z));
    for (const r of recs) { r.root.x += x; r.root.z += z; r.near = !!o.near; state.trees.push(r); }
  }
  state.pots.push({ x, z, foot: sh[0][1] * H * (o.fat ?? 1) + 2, R: pot.R, H });
  return geos;
}
async function buildLesser(ctx, state) {
  const { style, scene, rng, path } = state, rp = rng.fork('lesser');
  const alls = [0, 1, 2].map(() => ({ body: [], strap: [], tree: [], near: [] }));      // one set per colourway (0 = the world's own)
  const add = (g, near, cw = 0) => { for (const k in g) for (const x of g[k]) alls[k === 'strap' ? 0 : cw][near && k === 'body' ? 'near' : k].push(x); };
  // (repair 3) THE NINE POTS THE COURSE PASSES (the Bowl, the Bottle, seven valley pots) run on the world's clock like every pot, each
  // from its own seeded phase: no angle is typed for any of them. Where they stand is kept for the valley's shower (state.nearPots).
  const near9 = async (kind, H, x, z, o, cw = 0) => { state.nearPots.push({ x, z }); add(await makePot(ctx, state, rp, kind, H, x, z, o), true, cw); };
  // the Bowl, seen from above its rim on the right of the first leg; the Bottle, its neck just under the crossing
  await near9('bowl', BOWL.H, BOWL.x, BOWL.z, { cols: 96, rows: [2, 2, 2, 8, 10], trees: 16, treeL: [12, 26], budget: 110, near: true, inside: { trees: 15, budget: Math.round(240 * (0.6 + 0.4 * state.detail)) } });
  // the Bottle stands in the crossing, right of the line from the course to the strike point: while the great drop falls its
  // neck rises in the lower right of the picture and its shoulder band, just under the eye, blooms with small trees
  await near9('flask', 140, -285, 742, { cols: 72, rows: [2, 2, 2, 10, 14], edges: [0, 0.22, 0.38, 0.52, 0.77], trees: 12, treeL: [20, 32], budget: 180, near: true });
  await ctx.yield();
  // the valley's own pots (polish 1): whole pots with their friezes on both sides of the run-in, so the Jar's tree is seen among them
  // [kind, height, x, z, handle angle, trees, colourway]: a jar opposite the Pitcher (the course goes between them),
  // a jug and a tall vase left of the Jar's tree, a vase and a jar right of it, a jug behind the Bowl
  // (polish 2) re-staged for the new course: they flank the run-in, near enough that their warm lower slips are large in frame
  // (polish 3) the Bottle, a jar and a vase moved clear of the forest and the turn; three of the seven are in the ware's other colourways
  for (const [kind, H, x, z, ha, nT, cw] of [['jug', 170, -185, 905, 4.6, 11, 0], ['vase', 300, -330, 1010, 0, 13, 1], ['jar', 230, 150, 1215, 0, 13, 2],
    ['vase', 280, 1030, 1075, 1.3, 12, 0], ['jug', 220, -420, 800, 5.0, 10, 0], ['jar', 200, 420, 1330, 0, 11, 1], ['vase', 330, -640, 1080, 5.2, 11, 0]]) {
    await near9(kind, H, x, z, { cols: 50, rows: [2, 2, 2, 7, 11], handle: ha, trees: nT, treeL: [H * 0.14, H * 0.215], budget: Math.round(92 * (0.6 + 0.4 * state.detail)), near: true }, cw);
    await ctx.yield();
  }
  // twenty-six lesser pots out to 2.5 km: none in the corridor, none against the Jar, few in the entry's sky
  const kinds = ['jar', 'jug', 'vase', 'jug', 'bottle', 'jar', 'bowl', 'vase'];
  const placed = state.pots.slice();
  let made = 0;
  for (let tries = 0; tries < 900 && made < 16; tries++) {
    const kind = rp.pick(kinds), H = kind === 'bowl' ? rp.range(110, 190) : rp.range(150, 400);
    const ring = made / 16, x = rp.range(-2400, 2600) * (0.4 + 0.6 * ring), z = 60 + rp.range(0, 1950) * (0.55 + 0.45 * ring);
    const R = Math.max(...SHAPES[kind].map((p) => p[1])) * H;
    if (Math.hypot(x, z) < 700 + R + 110) continue;
    if (path.nearestXZ(x, z).dist < R + 130) continue;
    if (x > -330 - R && x < 250 + R && z < 1560) continue;      // nothing random between the run-in and the Jar's tree
    if (x > 60 - R && x < 1000 + R && z < 1420) continue;            // nor in the forest and the turn
    let ok = true;
    for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < R + p.R + 70) { ok = false; break; }
    if (!ok) continue;
    const far = Math.hypot(x + 150, z - 1100) > 1150;
    const g = await makePot(ctx, state, rp, kind, H, x, z, { cols: far ? 30 : 44, rows: far ? [1, 1, 1, 4, 7] : [1, 1, 2, 5, 9],
      handle: (kind === 'jug' || (kind === 'vase' && rp.chance(0.4))) ? rp.range(0, TAU) : 0,
      trees: Math.round((far ? 0 : 8) * (state.rare ? 0.5 : 1) * (0.6 + 0.4 * state.detail)), budget: 30 });   // beyond 150 m the glaze draws the fringe itself
    add(g, false, [0, 1, 0, 2, 0, 0, 1, 2][made % 8]); placed.push(state.pots[state.pots.length - 1]); made++;
    await ctx.yield();
  }
  const mk = (list, mat, order) => {
    if (!list.length) return null;
    const g = mergeGeometries(list); for (const x of list) x.dispose();
    if (order !== 3) g.computeBoundingSphere();      // the trees' meshes are never culled
    const m = new THREE.Mesh(g, mat); m.renderOrder = order; scene.add(m); return m;
  };
  await ctx.yield();
  // every merge is a step of its own, and no merge is large (the limit on a build step is 50 ms)
  const parts = async (list, mat, order, per) => { let last = null; for (let i = 0; i < list.length; i += per) { last = mk(list.slice(i, i + per), mat, order) || last; if (last) last.frustumCulled = order !== 3 && last.frustumCulled; await ctx.yield(); } return last; };
  for (let cw = 0; cw < 3; cw++) {
    const all = alls[cw], un = cw ? state.altSets[cw - 1] : undefined;
    if (all.body.length) await parts(all.body, style.glaze({ uniforms: un }), 0, 7);
    if (all.near.length) await parts(all.near, style.glaze({ fringe: 0, uniforms: un }), 0, 3);      // the valley's pots carry real friezes: no drawn fringe on them
    if (all.strap.length) await parts(all.strap, style.glaze({ side: THREE.DoubleSide }), 0, 8);
    if (all.tree.length) await parts(all.tree, cw ? style.stain({ uniforms: un }) : state.stainMat, 3, 70);
  }
}

// glaze attributes for a hand-built piece: v = [px, py, pz, nx, ny, nz, t, mpt, pool, phase, sx, sr, sy] per vertex
function glazeGeo(v, idx) {
  const n = v.length / 13, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), band = new Float32Array(n * 4), srf = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {                      // (polish 3: written straight in; four small arrays per vertex made the floor one long step)
    const o = i * 13, a = i * 3, b = i * 4;
    pos[a] = v[o]; pos[a + 1] = v[o + 1]; pos[a + 2] = v[o + 2]; nor[a] = v[o + 3]; nor[a + 1] = v[o + 4]; nor[a + 2] = v[o + 5];
    band[b] = v[o + 6]; band[b + 1] = v[o + 7]; band[b + 2] = v[o + 8]; band[b + 3] = v[o + 9]; srf[a] = v[o + 10]; srf[a + 1] = v[o + 11]; srf[a + 2] = v[o + 12];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aBand', new THREE.BufferAttribute(band, 4)); g.setAttribute('aSurf', new THREE.BufferAttribute(srf, 3));
  g.setIndex(new THREE.BufferAttribute(new (n > 65535 ? Uint32Array : Uint16Array)(idx), 1));
  return g;
}
// the inside of a bowl: bare cream body with honey pooled in the bottom, and a rolled lip over the outer wall
function innerBowl(rim, H, phase, slumpAmp, slumpDir) {
  const prof = [[rim + 1.6, H - 5], [rim + 1.2, H - 1], [rim - 0.5, H + 0.6], [rim - 3, H - 1], [rim * 0.9, H * 0.8], [rim * 0.72, H * 0.52], [rim * 0.5, H * 0.34], [rim * 0.25, H * 0.26], [0.5, H * 0.24]];
  const na = 64, v = [], idx = [];
  for (let i = 0; i < prof.length; i++) {
    const [r, y] = prof[i], p0 = prof[Math.max(i - 1, 0)], p1 = prof[Math.min(i + 1, prof.length - 1)];
    let nr = -(p1[1] - p0[1]), ny = p1[0] - p0[0]; const l = Math.hypot(nr, ny) || 1; nr /= -l; ny /= -l;      // facing in and up
    for (let j = 0; j <= na; j++) {
      const a = (j / na) * TAU, s = Math.sin(a), c = Math.cos(a);
      const yy = y - slumpAmp * smoothstep(0.72 * H, H, y) * (0.5 + 0.5 * Math.cos(a - slumpDir));
      const pool = i >= 4 ? clamp(1.25 - r / (rim * 0.75), 0, 1) : (i === 3 ? 0.35 : 0);
      v.push(s * r, yy, c * r, s * nr, ny, c * nr, -1, 1, pool, phase, s * r, 1, c * r);
    }
  }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < na; j++) {
    const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  return glazeGeo(v, idx);
}

// (polish 2) The inside of the great Bowl: the lip, then a band of the same blue slip from near the rim down toward the well
// (pinstripes, cog border, its own slip front, as on every belly), then bare body with honey pooled deep in the bottom.
// Trees root on the band's lower pinstripe and climb outward toward the rim: from above, a wreath round a honey pool.
async function bowlInside(ctx, state, rp, rim, H, phase, sl, o) {
  const P0 = [0.44 * rim, 0.31 * H], P1 = [0.8 * rim, 0.43 * H], P2 = [0.93 * rim, 0.83 * H];
  const bez = (f, k) => (1 - f) * (1 - f) * P0[k] + 2 * f * (1 - f) * P1[k] + f * f * P2[k];
  let S = 0; for (let i = 0; i < 24; i++) S += Math.hypot(bez((i + 1) / 24, 0) - bez(i / 24, 0), bez((i + 1) / 24, 1) - bez(i / 24, 1));
  const Rref = bez(0.5, 0), slump = (a, y) => y - sl.amp * smoothstep(0.72 * H, H, y) * (0.5 + 0.5 * Math.cos(a - sl.dir));
  // rows from the lip inward: [r, y, kind]  kind 0 bare body, 1 blue band (f in the 4th slot)
  const rows = [[rim + 1.6, H - 5, 0], [rim + 1.2, H - 1, 0], [rim - 0.5, H + 0.6, 0], [rim - 3, H - 1, 0], [bez(1, 0) + 1, bez(1, 1) + 2.5, 0], [bez(1, 0), bez(1, 1), 0]];
  const nB = 12;
  for (let i = nB; i >= 0; i--) rows.push([bez(i / nB, 0), bez(i / nB, 1), 1, i / nB]);
  rows.push([bez(0, 0), bez(0, 1), 0, 0, 0.75], [0.3 * rim, 0.262 * H, 0, 0, 0.8], [0.14 * rim, 0.246 * H, 0, 0, 1], [0.5, 0.24 * H, 0, 0, 1]);
  const na = 96, v = [], idx = [];
  for (let i = 0; i < rows.length; i++) {
    const [r, y, kind, f, pl] = rows[i], p0 = rows[Math.max(i - 1, 0)], p1 = rows[Math.min(i + 1, rows.length - 1)];
    let nr = -(p1[1] - p0[1]), ny = p1[0] - p0[0]; const l = Math.hypot(nr, ny) || 1; nr /= -l; ny /= -l;      // facing in and up
    const lift = kind ? 0.4 : 0;
    for (let j = 0; j <= na; j++) {
      const a = (j / na) * TAU, s = Math.sin(a), c = Math.cos(a), rr = r + nr * lift, yy = slump(a, y) + ny * lift;
      const pool = kind ? 0 : (pl ?? (i === 3 ? 0.35 : i >= 4 ? 0.2 : 0));
      if (kind) v.push(s * rr, yy, c * rr, s * nr, ny, c * nr, 3 + f * 0.9999, S, 0, phase, a, Rref, f * S);
      else v.push(s * rr, yy, c * rr, s * nr, ny, c * nr, -1, 1, pool, phase, s * r, 1, c * r);
    }
    if (i % 6 === 5) await ctx.yield();
  }
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < na; j++) {
    const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const geo = glazeGeo(v, idx);
  await ctx.yield();
  // the band as a pot of its own for potTrees: x = angle * Rref, y = metres up the band from its lower pinstripe
  const pot = { R: Rref, phase, edgeAt: (k) => (k === 3 ? 0 : S),
    surf: (a, m, out, lift = 0) => {
      const f = clamp(m / S, 0, 1), r = bez(f, 0), y = bez(f, 1), f1 = Math.min(f + 0.02, 1), f0 = Math.max(f - 0.02, 0);
      let dr = bez(f1, 0) - bez(f0, 0), dy = bez(f1, 1) - bez(f0, 1); const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
      const nr = -dy, ny = dr, s = Math.sin(a), c = Math.cos(a), rr = r + nr * (0.4 + lift);
      out[0] = s * rr; out[1] = slump(a, y) + ny * (0.4 + lift); out[2] = c * rr; out[3] = s * nr; out[4] = ny; out[5] = c * nr; return out;
    } };
  const list = [];
  for (let i = 0; i < o.trees; i++) list.push({ a: -Math.PI + (i + rp.range(0.25, 0.75)) * TAU / o.trees, L: S * rp.range(0.55, 0.86), delay: rp.pick([0, 0.05, 0.12]), wide: 0.5, budget: o.budget, grow: 5 });
  const { geos, recs } = await potTrees(ctx, state, pot, list, rp, state.habit);
  return { geo, trees: geos, recs };
}

// ================================================================ the floor: the same cream ware, honey pooled round every foot
async function buildFloor(ctx, state) {
  const { style, scene, pots } = state, N = Math.round(100 * (0.75 + 0.25 * state.detail)), cx = -80, cz = 1000, S = 3900;
  const v = new Float32Array((N + 1) * (N + 1) * 13), idx = new Uint32Array(N * N * 6);
  const warp = (g) => Math.sign(g) * Math.pow(Math.abs(g), 1.8) * S;
  for (let j = 0; j <= N; j++) {
    const z = cz + warp((j / N) * 2 - 1);
    for (let i = 0; i <= N; i++) {
      const x = cx + warp((i / N) * 2 - 1);
      // honey deepens toward the horizon; the pool round each foot is drawn by the floor's own glaze, flat inside a wandering edge
      const far = smoothstep(900, 3600, Math.hypot(x - cx, z - cz));
      const o = (j * (N + 1) + i) * 13;
      v[o] = x; v[o + 2] = z; v[o + 4] = 1; v[o + 6] = 4.5; v[o + 7] = 4000; v[o + 8] = clamp(0.48 + 0.4 * far, 0, 1); v[o + 9] = 0.37; v[o + 10] = x / 16; v[o + 11] = 1; v[o + 12] = z / 16;
    }
    if (j % 6 === 5) await ctx.yield();
  }
  for (let j = 0, q = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = b;
    }
    if (j % 25 === 24) await ctx.yield();
  }
  await ctx.yield();
  const g = glazeGeo(v, idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 0, cz), S * 1.5);
  await ctx.yield();
  const fm = style.glaze({ floor: pots });
  fm.uniforms.uShade.value.set(0.93, -0.37);                 // the glaze ran away from the window: every pool is drawn out to the right of its pot
  state.flood = fm.uniforms.uFlood.value; state.flood.set(state.hero.anchors.strike.x, state.hero.anchors.strike.z - 14, 0, 0);
  scene.add(new THREE.Mesh(g, fm));
  await ctx.yield();
  // (polish 3) THE TRAY'S RIM: the country of pots stands on a tray of the same ware, and its rim stands round the horizon as one
  // large calm shape: the same slips in the same order (chocolate, olive, tan, the blue with its cog border and a dark fringe of
  // far trees, cream lip), 600 m high and three kilometres off, a slip front going slowly round it. It pales less than the pots do.
  const RIM = [[0, 0], [1, 90], [2, 190], [3, 310], [4, 540], [5, 700]], nc = 128, rv = [], ri = [], R0 = 3300;
  for (let k = 0; k < 5; k++) for (let e = 0; e < 2; e++) {
    const y = RIM[k + e][1], r = R0 + 0.5 * y, mpt = RIM[k + 1][1] - RIM[k][1];
    for (let j = 0; j <= nc; j++) {
      const a = (j / nc) * TAU, sn = Math.sin(a), cs = Math.cos(a), yy = y + (k + e > 0 ? 9 * Math.sin(a * 5 + k + e) + 5 * Math.sin(a * 13 + 2 * (k + e)) : 0);
      rv.push(cx + sn * r, yy, cz + cs * r, -sn * 0.894, 0.447, -cs * 0.894, k + e * 0.9999, mpt, 0, 0.61, a, R0, yy);
    }
  }
  for (let k = 0; k < 5; k++) for (let j = 0; j < nc; j++) { const a = (k * 2) * (nc + 1) + j, b = a + 1, c = a + nc + 1, d = c + 1; ri.push(a, b, d, a, d, c); }
  const rg = glazeGeo(rv, ri); rg.computeBoundingSphere();
  const rim = new THREE.Mesh(rg, style.glaze({ lap: [0, 0.999, 6], side: THREE.DoubleSide, uniforms: { uPale: { value: 0.07 } } })); rim.frustumCulled = false; scene.add(rim);
}

// ================================================================ the drops: beads past the lens, a bead for every tree, showers
const LAP = 16;                                    // seconds for a slip front to go round a pot (the style's clock runs at 24 / LAP)
const FALL_STRETCH = 1.12;                         // (d1) a falling bead of a column is drawn this many times as tall as wide (the lens columns' and the valley's; the tied beads keep their own TIED_STRETCH)
const AFTER = 0;                                   // (d1) seconds a column goes on being counted after its bead has touched the tray (d1/touch: nothing follows the touch)
// (d1b) THE TOUCH OF A FALLING BEAD, ONE TEXT (the lens columns' updater and the valley's both call it; nothing else does).
// The body is a ball about the bead's centre: its DRAWN half width sx (what the updater gives the instance: the far rule's factor and
// the swelling at the lap's top are in it) and its drawn half height FALL_STRETCH * sx, the same for every gaze. It is gone (size 0)
// from the step that body reaches (a) the tray, height 0, under its foot, or (b) the top of a worm trail, TRAIL_TOP, where the trail
// is drawn: at plan distance d from the nearest drawn place of a ribbon the ball's underside is at y - FALL_STRETCH * sx *
// sqrt(1 - (d / sx)^2); d is 0 for a line that stands on the ribbon. It reads: the bead's centre height y, its drawn half width sx,
// and c.trail, the column's own short list made once in the build by trailSteps (below): rows of [the trail's own uniform uLen, the
// laid length from which that place is drawn, its plan distance]. The list is read only by a bead within TRAIL_TOP of the ground.
const TRAIL_TOP = Math.fround(0.6);                // metres: the height the trail ribbons lie at (ribbon() in buildBloom lays them with this same figure)
const beadGone = (c, y, sx) => {
  if (y - FALL_STRETCH * sx <= 0) return true;                        // its foot is on the tray
  const T = c.trail; if (!T || y - FALL_STRETCH * sx > TRAIL_TOP) return false;
  let d = Infinity; for (let i = 0; i < T.length; i += 3) if (T[i].value >= T[i + 1] && T[i + 2] < d) d = T[i + 2];
  return d < sx && y - FALL_STRETCH * sx * Math.sqrt(1 - (d / sx) * (d / sx)) <= TRAIL_TOP;
};
// (d1b) WHERE A COLUMN'S LINE STANDS BY THE WORM TRAILS: worked out once, in the build, for the line at (x, z) whose largest bead
// is R wide (half width). It reads the ribbons' OWN built buffers (state.trails, filled by buildBloom: each ribbon's geometry and its
// uLen uniform), so the trail's builder and this test hold the same places; no clock, no u, no seed, no lens; it draws from no stream.
// What of a ribbon is drawn is TRAIL_FS's law: a ribbon point s metres along and w metres across (half width hw) is opaque when
// s >= hw - sqrt(hw^2 - w^2) (the start is round) and the laid length uLen >= s + hw - sqrt(hw^2 - w^2) (the running end is round).
// Every ribbon face that comes within R of the line gives a row: its exact plan distance from the line (0 when the line stands in
// it) and a length at or before the least uLen at which any of it is opaque (never later than the truth, so a bead is never drawn
// through a drawn trail). A face is first cut in four, again and again, while one of the ribbon's round ends runs through it (the
// start, or the end of the whole ribbon at its full length: eight times at most, to a tenth of a metre across), and, where the
// running end has yet to cross it as built (the one trail that is laid during the flight), until that length is within TRAIL_STEP
// of the face's latest corner (six times at most): so the rows follow the round ends where they lie and the running one as it
// passes (early by up to about 3.8 m of laid length at the ribbon's edge, never late: see TRAIL_STEP). A face the round start leaves wholly bare, or that lies wholly past the ribbon's full length, gives none. The rows of a
// ribbon are kept in order of that length, only those nearer than every earlier one. Returns the rows flat ([uLen uniform, length,
// distance, ...]) or null for a line that stands by no trail.
const TRAIL_STEP = 1.2;                            // metres of laid length: a face the running end has yet to cross is cut no further once it spans less than this. It is NOT a bound on a row: six cuts do not reach it at the ribbon's edge, where the round end stands almost upright, and a row there runs up to about 3.8 m ahead of the truth (the checker's count; half the rows under 0.7 m). The running end goes 1.08 to 1.81 m a sixtieth of a second, so a bead by the edge can be gone two or three sixtieths before the trail is under it; never after
function trailSteps(trails, x, z, R) {
  const seg = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz, t = l > 0 ? clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l, 0, 1) : 0; return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const tri = (a, b, c) => {      // plan distance from the line to the face a b c (0 inside it)
    const d1 = (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (z - b[1]), d2 = (x - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (z - c[1]), d3 = (x - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (z - a[1]);
    return (d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0) ? Math.min(seg(a, b), seg(b, c), seg(c, a)) : 0;
  };
  const mid = (p, q) => p.map((v, k) => (v + q[k]) / 2), out = [];
  for (const T of trails) {
    const { g, len, full } = T, P = g.attributes.position.array, A = g.attributes.aT.array, I = g.index.array, rows = [];
    const corner = (v) => [P[v * 3], P[v * 3 + 2], A[v * 3], A[v * 3 + 1] * A[v * 3 + 2], A[v * 3 + 2]], cell = (v) => Math.floor(v / 16);
    // the ribbon's faces binned in plan (cells 16 m square), from its buffers, the first time a line asks
    if (!T.grid) {
      T.grid = new Map();
      for (let t = 0; t < I.length; t += 3) {
        const xs = [P[I[t] * 3], P[I[t + 1] * 3], P[I[t + 2] * 3]], zs = [P[I[t] * 3 + 2], P[I[t + 1] * 3 + 2], P[I[t + 2] * 3 + 2]];
        for (let ix = cell(Math.min(...xs)); ix <= cell(Math.max(...xs)); ix++) for (let iz = cell(Math.min(...zs)); iz <= cell(Math.max(...zs)); iz++) { const k = ix * 65536 + iz; if (!T.grid.has(k)) T.grid.set(k, []); T.grid.get(k).push(t); }
      }
    }
    const face = (a, b, c, deep) => {      // a corner: x, z, s, w, hw
      const d = tri(a, b, c); if (d >= R) return;
      // (this is TRAIL_FS's round-end law held a second time, in script: whoever changes the one changes the other) how far the round end stands back at a corner, hw - sqrt(hw^2 - w^2): `back` takes it along its tangent at the face's middle (never more than the truth), `late` exactly
      const hw = a[4], wm = (a[3] + b[3] + c[3]) / 3, q = Math.sqrt(Math.max(hw * hw - wm * wm, 1e-9)), back = (p) => hw - q + (wm / q) * (p[3] - wm), late = (p) => p[2] + hw - Math.sqrt(Math.max(hw * hw - p[3] * p[3], 0));
      const lo = Math.min(a[2] + back(a), b[2] + back(b), c[2] + back(c)), hi = Math.max(late(a), late(b), late(c));
      if (Math.max(a[2] - back(a), b[2] - back(b), c[2] - back(c)) < 0 || lo > full) return;      // the round start leaves it wholly bare, or it lies past the ribbon's end
      const ends = Math.min(2 * a[2] - late(a), 2 * b[2] - late(b), 2 * c[2] - late(c)) < 0 || hi > full;      // a round end runs through it (a corner the start leaves bare, or one past the full length)
      if (deep > 0 && (ends || (deep > 2 && hi > len.value && hi - lo > TRAIL_STEP))) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); face(a, ab, ca, deep - 1); face(ab, b, bc, deep - 1); face(ca, bc, c, deep - 1); face(ab, bc, ca, deep - 1); }
      else rows.push([lo, d]);
    };
    const done = new Set();
    for (let ix = cell(x - R); ix <= cell(x + R); ix++) for (let iz = cell(z - R); iz <= cell(z + R); iz++) for (const t of T.grid.get(ix * 65536 + iz) || [])
      if (!done.has(t)) { done.add(t); face(corner(I[t]), corner(I[t + 1]), corner(I[t + 2]), 8); }
    rows.sort((p, q) => p[0] - q[0]);
    let best = Infinity; for (const [l, d] of rows) if (d < best) { best = d; out.push(len, l, d); }
  }
  return out.length ? out : null;
}
// (d1) THE LOOSE SHOWERS' LAW, ONE TEXT. Where a loose drop is at clock t is written once, here: the drop's own vertex text and the
// build's test of the lines that come to ware (looseStandOff) both hold these four figures and no other copy of them.
// range: the height its point falls through before it comes out of the cream again; swayX, swayZ: how far the whole line drifts either
// way on the clock; lean: metres its line stands off in x for every metre of height.
const LOOSE = { range: 720, swayX: 14, swayZ: 9, lean: 0.02 };
const glf = (x) => (Number.isInteger(x) ? x + '.' : String(x));      // a figure as GLSL writes a float
const LOOSE_LAW = /* glsl */`
#define LOOSE_RANGE ${glf(LOOSE.range)}
#define LOOSE_SWAYX ${glf(LOOSE.swayX)}
#define LOOSE_SWAYZ ${glf(LOOSE.swayZ)}
#define LOOSE_LEAN ${glf(LOOSE.lean)}
float looseFallen(vec4 s, float t){ return mod(t * s.x + s.y * LOOSE_RANGE, LOOSE_RANGE); }
vec3 loosePoint(vec3 p0, vec4 s, float t, float y){ return vec3(p0.x + (LOOSE_SWAYX * sin(t * 0.11 + s.w) + LOOSE_LEAN * y), y, p0.z + LOOSE_SWAYZ * sin(t * 0.083 + s.w * 1.7)); }
float looseTh(float resY){ return 13. * resY / 450.; }      // (polish 2) a drop under this many pixels across is too far to be drawn as a drop
`;
const CURTAIN_VS = /* glsl */`
uniform float uTime, uResY, uPale; uniform vec3 uInk, uCream;
attribute vec4 aSeed;                              // fall speed, phase, radius m, sway phase
varying vec3 vCol; varying float vPx;
${LOOSE_LAW}
void main(){
  vec3 p = loosePoint(position, aSeed, uTime, LOOSE_RANGE - looseFallen(aSeed, uTime));
  float range = LOOSE_RANGE;
  // (d1) THE DROP STANDS ON ITS FOOT. Its body is a disc of radius aSeed.z hung one radius under the point p (the fragment text), so
  // its lowest place is two radii under p. The drop is drawn whole until that foot touches the tray at height 0 and not at all below it.
  float foot = p.y - 2. * aSeed.z;
  vec4 mv = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * (viewMatrix * vec4(p.x, foot, p.z, 1.));
  float dist = length(mv.xyz);
  float px = aSeed.z * projectionMatrix[1][1] * uResY / max(-mv.z, 1.);    // diameter in pixels
  vPx = px;
  gl_PointSize = clamp(px * 2., 4., 96.);                                        // the sprite holds the bead and its tail
  gl_Position.y += gl_PointSize / uResY * gl_Position.w;                         // (d1) the sprite is lifted by half its own height: its lower edge, the body's lowest place, is the foot at every size
  float fadeIn = 1. - smoothstep(range - 90., range, p.y);                       // the drops simply come out of the cream
  // (polish 2) a drop too far to be drawn as a drop is not drawn at all: no cloud of specks.
  float th = looseTh(uResY);
  vCol = mix(uInk, uCream, clamp(uPale * (1. - exp(-dist / 900.)) + (1. - fadeIn), 0., 1.));
  if (px < th || foot < 0.) gl_Position = vec4(2., 2., 2., 1.);
}`;
const CURTAIN_FS = /* glsl */`
uniform vec3 uWinCol;
varying vec3 vCol; varying float vPx;
void main(){
  // (polish 2) each is a drop, round below and drawn out to a point above, so a shower reads as falling drops and never as specks
  vec2 p = gl_PointCoord * 2. - 1.;                 // +y is down the sprite
  vec2 q = (p - vec2(0., 0.5)) / 0.5;               // the bead: a disc in the lower half
  float tl = clamp(-q.y / 1.4, 0., 1.), a = 2. / max(vPx, 2.);
  float r = (q.y > 0.) ? length(q) : abs(q.x) / max(sqrt(max(1. - tl, 0.)), 0.03);
  if (r > 1. || tl >= 1.) discard;
  vec2 w = abs(q - vec2(-0.3, -0.34)) - vec2(0.17, 0.22);
  float win = (1. - smoothstep(-a, a, max(w.x, w.y))) * clamp(vPx / 9. - 0.4, 0., 1.);
  gl_FragColor = vec4(mix(vCol, uWinCol, 0.85 * win), 1.);
}`;
async function buildDrops(ctx, state) {
  const { style, scene, rng, path, detail, density } = state, rd = rng.fork('drops'), U = style.uniforms;
  // ---- beads past the lens: columns beside the course, three beads to a column
  const cols = [];
  const nCol = Math.round(76 * (0.7 + 0.3 * detail));      // (polish 3) fewer and bigger: each one is plainly a drop
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  for (let i = 0; i < nCol; i++) {
    const u = i < 12 ? rd.range(0.01, 0.08) : i < 30 ? rd.range(0.08, 0.24) : i < 44 ? rd.range(0.3, 0.47) : i < 58 ? rd.range(0.35, 0.47) : rd.range(0.47, 0.97);      // (polish 5) more in the run-in and round the strike, where little else runs on the clock
    path.pointAt(u, _p); path.tangentAt(u, _t);
    const late = i >= 58, side = rd.chance(0.5) ? 1 : -1, off = rd.range(16, 26) * (late ? 3.2 : u > 0.24 && u < 0.47 ? 1.8 : 1.4) * side;      // (polish 5) none within 22 m of the lens; in the grove few, far and large
    const x = _p.x - _t.z * off, z = _p.z + _t.x * off;
    if (Math.hypot(x - PC[0], z - PC[1]) < PR + 6 || Math.hypot(x, z) < 712 || state.pots.some((q) => Math.hypot(x - q.x, z - q.z) < q.R + 8) || state.handle.some((h) => Math.hypot(x - h.x, z - h.z) < 12)) continue;   // not through a pot, nor through the handle's strap
    const cross = u > 0.24 && u < 0.47;           // the crossing: beads small, so the great drop is the one big bead in the picture
    if (late && i % 3) continue;
    cols.push({ x, z, y: _p.y, r: rd.range(1.0, 1.9) * (cross ? 1.5 : late ? 1.7 : 1.3), v: rd.range(13, 20), ph: rd(), n: cross ? 3 : 2, cross, late });   // small ones: more to a column, in the low mesh
  }
  // (polish 5) round the strike, where everything else hangs on the flight, the shower is still falling: beads between the lens
  // and the wall, 34 m and more off, three to a column
  for (let j = 0; j < 20; j++) {
    const u = 0.372 + j * 0.005; path.pointAt(u, _p); path.tangentAt(u, _t);
    const l = Math.hypot(_t.x, _t.z) || 1, off = rd.range(34, 72) * (1 + (j % 3) * 0.45), bx = rd.range(-18, 18) * 2.2;      // (polish 6) spread: seen end-on they stood in one stack
    cols.push({ x: _p.x + (_t.z / l) * off + (_t.x / l) * bx, z: _p.z - (_t.x / l) * off + (_t.z / l) * bx, y: _p.y + 10, r: rd.range(1.7, 2.5), v: rd.range(13, 19), ph: rd(), n: 3, cross: true, range: 96 });
  }
  // (repair 3) the nine large columns that hung from one point of the course (path.pointAt(0.25)) are gone: the first valley's large
  // drops are a shower of the place, dealt in buildValleyRain from a stream of its own. Their draws left this stream, so the tied
  // beads, the wall's runs and the far curtains below are dealt anew once on every seed (nothing is burnt to hold the old deal).
  // ---- a bead for every tree: it lands on the wet slip at the moment the tree is born
  const tied = [];
  for (const t of state.trees) if (t.near || rd.chance(0.3 * detail)) tied.push({ t, r: clamp(t.L * 0.045, 0.7, 2.4), v: rd.range(20, 30) });
  // (cure 7) live's own figures for a tied bead, named once so that the law of the place below and the updater read the same ones:
  // it first shows TIED_TOP metres over its tree and swells to its size over the next TIED_SWELL of its fall (the updater had
  // smoothstep(240, 200, h)); falling, it is drawn TIED_STRETCH times as tall as wide; its line stands tiedOff(r) off the root along
  // the pot's normal and its centre tiedUp(r) over its height
  const TIED_TOP = 240, TIED_SWELL = 40, TIED_STRETCH = 1.12, tiedOff = (r) => r * 0.9 + 0.3, tiedUp = (r) => r * 0.5;
  // ---- beads that run down the Jar's wet wall beside the pass and the climb
  const runs = [];
  for (let i = 0, n = Math.round(54 * (0.6 + 0.4 * detail)); i < n; i++) runs.push({ x: i % 3 ? rd.range(40, 232) : rd.range(-40, 335), y: rd.range(150, 252), len: rd.range(60, 120), v: rd.range(4, 8), ph: rd(), r: rd.range(1.5, 2.8), k: rd.range(0, 6) });   // (polish 3) fewer, bigger: drops, not specks
  // (d1) how many laps deep a column is: the least whole number that holds the fall of a bead down to the tray, and AFTER seconds more
  // at the column's speed. No bead is added to the deal: each of the c.n dealt beads is drawn through every lap of its fall, so the
  // column holds c.n * c.deep instances.
  // (d1b) the fall is counted for a bead of ANY drawn size, down to the smallest the far rule can draw: its centre's whole way to
  // height 0 (c.y + range * 0.633), so no instance goes back to the top before its bead has touched. And where the column's line
  // stands by the worm trails (c.trail: trailSteps above, from the ribbons buildBloom laid).
  for (const c of cols) {
    const range = c.range || 150;
    c.deep = Math.max(1, Math.ceil((c.y + range * 0.633 + AFTER * c.v) / range));
    c.trail = trailSteps(state.trails, c.x, c.z, c.r); if (c.trail) await ctx.yield();      // a line by a trail is a build step of its own
  }
  let nNear = 4, nCross = 0;
  for (const c of cols) if (c.cross) nCross += c.n * c.deep; else nNear += c.n * c.deep;
  const nFar = tied.length;     // the wall's runs are small and far: they ride in the low mesh
  // every small bead is a lens-facing disc shaded as a sphere (style.bead): round at any size, 32 triangles each
  const mat = style.bead();
  const near = new THREE.InstancedMesh(style.beadGeometry(), mat, nNear);
  const far = new THREE.InstancedMesh(style.beadGeometry(), mat, nFar + runs.length + nCross);
  near.frustumCulled = far.frustumCulled = false; near.renderOrder = far.renderOrder = 4;
  near.instanceMatrix.setUsage(THREE.DynamicDrawUsage); far.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(near, far);
  // ---- (cure 7) THE TIED BEADS' LAW OF THE PLACE: no tied bead falls through the course.
  // A world entered through a portal arrives with its clock already running, so a tied bead may be at any height of its fall when the
  // lens comes by; on live the course crossed the ring of the Bowl's inner wreath 186 m over the roots and the lens could pass INSIDE
  // a bead there. The law asks no clock, no u, no seed and no lens: it tests the bead's WHOLE FALL (every height from where it first
  // shows down to its tree, with the size the bead has at that height) against the course's WHOLE LINE in space, once, in the build.
  // The bead is taken at its worst: a ball about its centre whose radius is the farthest its drawn outline reaches from that centre,
  // the tip of its tail (read from the bead's own text in the part; whichever way the lens-facing disc is turned, it is inside that
  // ball). Between the ball and the course's line there must be TIED_CLEAR metres of air at every height. A bead that passes stays as
  // it was dealt. One that fails keeps its tree, its line, its radius, its speed, its phase and the moment it lands; only the height
  // at which it FIRST SHOWS is lowered, to the highest from which its whole fall clears: it comes into being under the course and
  // falls on as before. Nothing is drawn from any stream.
  const TIED_CLEAR = 2.0;                          // metres of clear air between a bead's outline and the course's line (the site owner's figure for every such cure)
  await tiedLaw(ctx, state, tied, mat.vertexShader, { top: TIED_TOP, swell: TIED_SWELL, stretch: TIED_STRETCH, off: tiedOff, up: tiedUp, clear: TIED_CLEAR });
  // the bead that slides down the Pitcher's handle
  const hp = state.handle, hc = new THREE.Vector3(PC[0] + Math.sin(HANDLE_A) * 118, 168, PC[1] + Math.cos(HANDLE_A) * 118);
  const m4 = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const put = (mesh, i, x, y, z, sx, sy) => { m4.makeScale(sx, sy, sx); m4.setPosition(x, y, z); mesh.setMatrixAt(i, m4); };
  // (d1) THE BEADS PAST THE LENS END BY TOUCHING. The frame law is gone (a bead was shrunk to nothing toward the picture's edge wherever
  // the lens stood: it dwindled in the air); a bead that passes the picture's edge is out of sight, as a pot is. And no bead ends its
  // lap in the air: a column is c.deep laps deep, so each bead live deals falls on below its lap's foot at its own speed, at its full
  // size, until its foot (its centre less its own half height) is on the tray at height 0; from there it is not drawn. Above the lap's
  // foot every bead stands where it stood. Nothing NEW here reads the frame, the flight or a seed; the far rule two lines down (far0,
  // a bead's size by its distance from the eye's place) is live's own and is left as live.
  state.updaters.push((dt, time, camera, u, cp) => {
    let k = 0, kc = nFar + runs.length;
    for (const c of cols) for (let q = 0, nq = c.n * c.deep; q < nq; q++) {
      const range = c.range || 150, fall = (time * c.v + (c.ph + q / c.n) * range) % (c.deep * range), f = fall / range, j = q % c.n;      // metres fallen from the top; f is 0 at the top
      const far0 = c.late ? 1 : 1 - smoothstep((c.far || 104) - 16, c.far || 104, Math.hypot(c.x - cp.x, c.z - cp.z));      // (polish 5) a bead too far off to be seen as a drop is not there: no specks
      // (d1b) drawn at the size the laws above give it (sx) until the ball of THAT size touches the tray or a drawn trail (beadGone), then not at all
      const y = c.y + range * 0.633 - fall, sx = far0 * c.r * smoothstep(0, 0.08, f) * (0.75 + 0.25 * ((j * 7 + 3) % 5) / 4), s = beadGone(c, y, sx) ? 0 : sx;
      if (c.cross) put(far, kc++, c.x, y, c.z, s, s * FALL_STRETCH); else put(near, k++, c.x, y, c.z, s, s * FALL_STRETCH);
    }
    for (let j = 0; j < 4; j++) {                  // the handle's beads: down the outside of the strap, one every few seconds
      const f = (time / 11 + j * 0.27) % 1, fi = lerp(12, hp.length - 6, f * f * (3 - 2 * f) * 0.6 + f * 0.4), i0 = Math.floor(fi);
      _a.lerpVectors(hp[i0], hp[i0 + 1], fi - i0); _b.subVectors(_a, hc).normalize();
      const s = (1.2 + 0.25 * j) * smoothstep(0, 0.06, f) * (1 - smoothstep(0.94, 1, f));
      put(near, k++, _a.x + _b.x * 2.6, _a.y + _b.y * 2.6, _a.z + _b.z * 2.6, s, s);
    }
    const wetK = smoothstep(0.44, 0.5, u);      // (polish 3) only once we are near enough for each to be a drop
    let ri = nFar;
    for (const r of runs) {
      const f = ((time * r.v) / r.len + r.ph) % 1, y = Math.max(r.y - f * r.len, 46);
      const s = r.r * wetK * smoothstep(0, 0.05, f) * (1 - smoothstep(0.9, 1, f));
      state.hero.wallPoint(r.x + 2.2 * Math.sin(y * 0.07 + r.k), y, s * 1.02 + 0.05, _a);      // it sits on the wall, whole: the wall never cuts it
      put(far, ri++, _a.x, _a.y, _a.z, s, s * 1.25);
    }
    near.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < nFar; i++) {
      const d = tied[i], t = d.t, ph = (time / LAP + t.start) % 1, left = (1 - ph) * LAP;   // seconds until it lands
      const h = left * d.v, show = h < d.top ? smoothstep(d.top, d.top - TIED_SWELL, h) : 0, land = smoothstep(0.012, 0, ph);      // (cure 7) d.top is TIED_TOP (240, as it was) unless the law of the place lowered it
      const dd = Math.hypot(t.root.x - cp.x, t.root.y - cp.y, t.root.z - cp.z);      // (polish 6) a bead too far off to be seen as a drop is not there
      const hh = ph < 0.012 ? 0 : h, s = (t.jar && u < 0.56) ? 0 : d.r * Math.max(show, land) * (1 - smoothstep(d.r * 75, d.r * 95, dd));
      put(far, i, t.root.x + t.normal.x * tiedOff(d.r), t.root.y + hh + tiedUp(d.r), t.root.z + t.normal.z * tiedOff(d.r), s, s * (TIED_STRETCH - 0.6 * land));
    }
    far.instanceMatrix.needsUpdate = true;
  });
  await ctx.yield();
  // ---- showers: loose curtains of beads that come out of the cream (density sets how many)
  const nCur = 1 + clamp(Math.round(1 + (density - 0.7) / 0.6 * 4), 1, 5), per = Math.round(80 * detail);      // (polish 5) fewer and larger: each one plainly a drop
  const pos = new Float32Array(nCur * per * 3), seed = new Float32Array(nCur * per * 4);
  const spots = [[-560, 880], [640, 1480], [-620, 1320], [1080, 760], [120, 1700], [-250, 1900]];   // (polish 5) none hangs over the course or in the grove   // the first hangs before the Jar, right of the tree
  for (let c = 0; c < nCur; c++) {
    const [sx, sz] = spots[c], a0 = rd.range(0, Math.PI), ang = c === 0 ? -0.33 : a0, len = rd.range(240, 420);
    for (let i = 0; i < per; i++) {
      const o = (c * per + i), a = rd.range(-0.5, 0.5) * len, b = rd.gauss() * 22;
      pos.set([sx + Math.cos(ang) * a - Math.sin(ang) * b, 0, sz + Math.sin(ang) * a + Math.cos(ang) * b], o * 3);
      seed.set([rd.range(14, 20), rd(), rd.range(6.5, 10.5), rd.range(0, 6.28) * 0.15 + c * 1.9], o * 4);
      if (state.courseDist(pos[o * 3], pos[o * 3 + 2]) < 90) seed[o * 4 + 2] = 0;      // and no drop of a shower within 90 m of the course (repair 3: from eyes every 2.5 m of route; it was path.nearestXZ's grid of shares of the flight)
    }
  }
  await looseStandOff(ctx, state, pos, seed);      // (d1) the lines that come to ware stand off: after the whole deal, drawing nothing
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uResY: U.uResY, uPale: U.uPale, uInk: U.uInk, uCream: U.uCream, uWinCol: U.uWinCol },
    vertexShader: CURTAIN_VS, fragmentShader: CURTAIN_FS }));
  pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts);
}

// ================================================================ (d1) THE LOOSE LINES THAT COME TO WARE STAND OFF (called after the showers' deal in buildDrops)
// The designer's law: a drop ends by touching, and a drop does not slide down ware. A loose drop's line that comes to a pot, a strap or a
// lug at any moment of its sway would graze that skin for seconds, so such a line is MOVED OFF BY THE LEAST DISTANCE and falls on to the
// tray, whole, beside the pot. The test is of the place and is made once, in the build: every drop that has a radius is tested against
// the ware's BUILT skin (every glaze mesh but the tray's floor and its rim, read from their own triangles) at every sway it can have
// (LOOSE, the drop's own law). A line that reaches skin goes OUTWARD along the radius of the pot whose girth circle is nearest, away
// from its axis (never into a mouth), in steps of a fifth of EYE_STEP, to the first place that reaches no skin at any sway, stands in
// no pot's girth and keeps the showers' 90 m from the course; its sway, speed, phase and radius stay. One that finds no such place
// within 300 m is left unbuilt, as the deal's own 90 m rule leaves one (radius 0). It reads no clock, no u, no seed and no lens, and
// draws from no stream.
const LOOSE_KEEP = 90;                             // metres from the course a shower's drop keeps (the same figure as the deal's own line in buildDrops)
async function looseStandOff(ctx, state, pos, seed) {
  const { scene, style, pots } = state, n = seed.length / 4;
  // STEP: the skin is sampled no coarser than this (under 2 m, so that no place on a face is farther than 1 m from a sample); PAD: that
  // 1 m and 0.5 m for the lean over the body's own height; CELL: the plan grid the faces are binned in; MOVE, FARTHEST: the step and the bound of the move
  const STEP = 1.7, PAD = 1.5, CELL = 16, MOVE = EYE_STEP / 5, FARTHEST = 300;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, rMax = 0;
  for (let i = 0; i < n; i++) { const r = seed[i * 4 + 2]; if (!(r > 0)) continue; x0 = Math.min(x0, pos[i * 3]); x1 = Math.max(x1, pos[i * 3]); z0 = Math.min(z0, pos[i * 3 + 2]); z1 = Math.max(z1, pos[i * 3 + 2]); rMax = Math.max(rMax, r); }
  if (!(rMax > 0)) return;
  const leanMax = LOOSE.lean * (LOOSE.range + rMax);      // a skin point at height h is read against the line's place at h plus one radius: at most this far toward +x
  x0 -= FARTHEST + LOOSE.swayX + rMax + PAD; x1 += FARTHEST + LOOSE.swayX + rMax + PAD + leanMax; z0 -= FARTHEST + LOOSE.swayZ + rMax + PAD; z1 += FARTHEST + LOOSE.swayZ + rMax + PAD;
  // the ware: every mesh of the glaze but the tray's floor (its own program) and the tray's rim (the one glaze that pales by a figure of its own)
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.uniforms || !o.material.uniforms.uLap || (o.material.defines && o.material.defines.MOCHA_FLOOR) || o.material.uniforms.uPale !== style.uniforms.uPale) return;
    o.updateWorldMatrix(true, false);
    const g = o.geometry; meshes.push({ P: g.attributes.position.array, I: g.index ? g.index.array : null, e: o.matrixWorld.elements, nT: (g.index ? g.index.count : g.attributes.position.count) / 3 });
  });
  const T = new Float64Array(9);                   // one face in the world: three corners
  const load = (M, t) => {
    const { P, I, e } = M;
    for (let c = 0; c < 3; c++) {
      const v = (I ? I[t * 3 + c] : t * 3 + c) * 3, x = P[v], y = P[v + 1], z = P[v + 2];
      T[c * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; T[c * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; T[c * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    }
  };
  // the faces binned in plan, once (a face above the drops' whole fall is not read)
  const grid = new Map(), key = (ix, iz) => (ix + 32768) * 65536 + (iz + 32768);
  await ctx.yield();
  let turn = 0;
  for (let m = 0; m < meshes.length; m++) {
    const M = meshes[m];
    for (let t = 0; t < M.nT; t++) {
      if ((++turn & 2047) === 0) await ctx.yield();
      load(M, t);
      const ax = Math.min(T[0], T[3], T[6]), bx = Math.max(T[0], T[3], T[6]), az = Math.min(T[2], T[5], T[8]), bz = Math.max(T[2], T[5], T[8]);
      if (bx < x0 || ax > x1 || bz < z0 || az > z1 || Math.min(T[1], T[4], T[7]) > LOOSE.range) continue;
      for (let ix = Math.floor(ax / CELL), ix1 = Math.floor(bx / CELL); ix <= ix1; ix++) for (let iz = Math.floor(az / CELL), iz1 = Math.floor(bz / CELL); iz <= iz1; iz++) {
        const k = key(ix, iz); let c = grid.get(k); if (!c) grid.set(k, c = { tris: [], pts: null }); c.tris.push(m, t);
      }
    }
  }
  // a cell's skin is sampled the first time a test reads it: its faces' own points on a grid no coarser than STEP, those that lie in the cell
  const sample = (ix, iz) => {
    const c = grid.get(key(ix, iz)); if (!c) return null;
    if (c.pts) return c.pts;
    const out = [];
    for (let q = 0; q < c.tris.length; q += 2) {
      load(meshes[c.tris[q]], c.tris[q + 1]);
      const e2 = Math.max((T[3] - T[0]) ** 2 + (T[4] - T[1]) ** 2 + (T[5] - T[2]) ** 2, (T[6] - T[0]) ** 2 + (T[7] - T[1]) ** 2 + (T[8] - T[2]) ** 2, (T[6] - T[3]) ** 2 + (T[7] - T[4]) ** 2 + (T[8] - T[5]) ** 2);
      const k = Math.max(1, Math.ceil(Math.sqrt(e2) / STEP));
      for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) {
        const u = i / k, v = j / k, w = 1 - u - v, x = T[0] * w + T[3] * u + T[6] * v, z = T[2] * w + T[5] * u + T[8] * v;
        if (Math.floor(x / CELL) !== ix || Math.floor(z / CELL) !== iz) continue;
        const y = T[1] * w + T[4] * u + T[7] * v; if (y <= LOOSE.range) out.push(x, y, z);
      }
    }
    return (c.pts = new Float32Array(out));
  };
  // does the line at (x, z), radius r, REACH ware? Any skin point inside its sway rectangle widened by its radius and PAD, the lean
  // taken at that point's height plus one radius (the body's middle is one radius under the drop's point)
  const reach = (x, z, r) => {
    const hx = LOOSE.swayX + r + PAD, hz = LOOSE.swayZ + r + PAD;
    for (let ix = Math.floor((x - hx) / CELL), ix1 = Math.floor((x + hx + LOOSE.lean * (LOOSE.range + r)) / CELL); ix <= ix1; ix++) for (let iz = Math.floor((z - hz) / CELL), iz1 = Math.floor((z + hz) / CELL); iz <= iz1; iz++) {
      const p = sample(ix, iz); if (!p) continue;
      for (let i = 0; i < p.length; i += 3) if (Math.abs(p[i] - (x + LOOSE.lean * (p[i + 1] + r))) <= hx && Math.abs(p[i + 2] - z) <= hz) return true;
    }
    return false;
  };
  for (let i = 0; i < n; i++) {
    const r = seed[i * 4 + 2]; if (!(r > 0)) continue;
    await ctx.yield();
    const x = pos[i * 3], z = pos[i * 3 + 2];
    if (!reach(x, z, r)) continue;      // it reaches no skin: as dealt (on to the tray, or down a mouth, out of sight below the lip)
    let pot = null, best = Infinity;      // the pot whose girth circle is nearest
    for (const q of pots) { const d = Math.abs(Math.hypot(x - q.x, z - q.z) - q.R); if (d < best) { best = d; pot = q; } }
    const dx = x - pot.x, dz = z - pot.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    let placed = false;
    for (let s = 1; s * MOVE <= FARTHEST && !placed; s++) {
      if ((s & 15) === 0) await ctx.yield();
      const nx = x + ux * s * MOVE, nz = z + uz * s * MOVE;
      if (state.courseDist(nx, nz) < LOOSE_KEEP || pots.some((q) => Math.hypot(nx - q.x, nz - q.z) < q.R) || reach(nx, nz, r)) continue;
      pos[i * 3] = nx; pos[i * 3 + 2] = nz; placed = true;
    }
    if (!placed) seed[i * 4 + 2] = 0;      // no place within FARTHEST: left unbuilt
  }
  await ctx.yield();
}

// ================================================================ (cure 7) the tied beads' law of the place (called from their block in buildDrops)
// tied: the beads as dealt ({ t: its tree, r: its radius, v: its fall speed }); text: the bead's vertex text (the part's BEAD_VS, as the
// material holds it); F: the block's own figures (top, swell, stretch, off, up, clear). Sets d.top on every bead: F.top for one whose
// whole fall clears the course as dealt, lower for one that would not. It reads the course (state.path, state.eyeXZ) and the bead's
// own figures, nothing else: no clock, no u, no seed, no camera; it draws from no stream.
async function tiedLaw(ctx, state, tied, text, F) {
  const { path } = state, eyes = state.eyeXZ;
  const read = (re) => { const m = re.exec(text); if (!m) throw new Error('forest-from-a-drop: the bead text no longer holds ' + re.source); return m.slice(1).map(Number); };
  // the outline, from the bead's text: a unit disc, sx wide and sy tall about its centre; above the centre it is drawn out to a point,
  // the unit height 1 going to 1 + tail * tk, where tk runs from 0 to 1 as sy / sx goes from tk0 to tk0 + tk1
  const [tk0, tk1] = read(/tk = clamp\(\(sy \/ max\(sx, 1e-4\) - ([0-9.]+)\) \/ ([0-9.]+), 0\., 1\.\)/), [tail] = read(/position\.y \+ tl \* ([0-9.]+) \* tk/);
  // its farthest point from its centre, in half widths: the tail's tip, (1 + tail * tk) * stretch (2.52 with the figures as they stand); never under the round body's own (stretch, or 1)
  const reach = Math.max(1, F.stretch, F.stretch * (1 + tail * clamp((F.stretch - tk0) / tk1, 0, 1)));
  // the course's line near a bead is the chain of straight pieces between eyes FINE apart (a fifth of EYE_STEP: half a metre, at which
  // a piece leaves the curve by under a millimetre); a fall is tested at heights HS apart (an eighth of FINE)
  const FINE = EYE_STEP / 5, PER = Math.round(EYE_STEP / FINE), HS = FINE / 8, nPiece = Math.ceil(path.length / FINE);
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  // the law is a build step of its own and is cut into small ones (the engine hands back only when its slice of time is used up):
  // before it begins, after every sixteenth bead, and every sixty-fourth height of a bead whose fall is tested
  await ctx.yield();
  let turn = 0;
  for (const d of tied) {
    if ((++turn & 15) === 0) await ctx.yield();
    d.top = F.top;
    const t = d.t, x = t.root.x + t.normal.x * F.off(d.r), z = t.root.z + t.normal.z * F.off(d.r), y0 = t.root.y + F.up(d.r), R = reach * d.r;
    // between two tested heights the gap can change by no more than the step times (1 + the steepest the ball grows per metre of
    // fall: R times 1.5, smoothstep's steepest slope, over the swell), so that much is asked on top of the clearance: nothing between is missed
    const need = F.clear + (1 + R * 1.5 / F.swell) * HS;
    // in plan first (the bead's line is upright: its distance in plan to the course is the least any height of its fall can have), from
    // the eyes every EYE_STEP of route, a whole step allowed for the line between two eyes and for the route's last piece after the last eye
    const lim = need + R + EYE_STEP, piece = [];
    let done = -1, yLo = Infinity, yHi = -Infinity;
    for (let e = 0; e * 2 < eyes.length; e++) {
      const dx = eyes[e * 2] - x, dz = eyes[e * 2 + 1] - z;
      if (dx * dx + dz * dz >= lim * lim) continue;
      for (let k = Math.max(done + 1, (e - 1) * PER, 0); k < (e + 1) * PER && k < nPiece; k++) {      // the course a step either side of this eye, as pieces FINE long
        path.posAtDist(k * FINE, _a); path.posAtDist(Math.min((k + 1) * FINE, path.length), _b);
        piece.push(_a.x, _a.y, _a.z, _b.x - _a.x, _b.y - _a.y, _b.z - _a.z);
        yLo = Math.min(yLo, _a.y, _b.y); yHi = Math.max(yHi, _a.y, _b.y); done = k;
      }
    }
    if (!piece.length) continue;      // its line stands clear of the course in plan: as dealt
    // every height of its fall at which the course's line is nearer its centre than the clearance and its full reach: [height, distance]
    const hs = [];
    for (let j = Math.max(0, Math.floor((yLo - need - R - y0) / HS)); j * HS <= F.top && y0 + j * HS <= yHi + need + R; j++) {
      const y = y0 + j * HS; let best = Infinity;
      for (let p = 0; p < piece.length; p += 6) {
        const ax = piece[p], ay = piece[p + 1], az = piece[p + 2], ux = piece[p + 3], uy = piece[p + 4], uz = piece[p + 5];
        const f = clamp(((x - ax) * ux + (y - ay) * uy + (z - az) * uz) / (ux * ux + uy * uy + uz * uz || 1), 0, 1);
        const qx = ax + ux * f - x, qy = ay + uy * f - y, qz = az + uz * f - z, q = qx * qx + qy * qy + qz * qz;
        if (q < best) best = q;
      }
      best = Math.sqrt(best);
      if (best < need + R) hs.push(j * HS, best);
      if ((j & 63) === 63) await ctx.yield();
    }
    // does the whole fall clear, if the bead first shows at `top`? (at height h it is smoothstep(top, top - swell, h) of its size)
    const clears = (top) => { for (let i = 0; i < hs.length; i += 2) if (hs[i] <= top && hs[i + 1] < need + R * smoothstep(top, top - F.swell, hs[i])) return false; return true; };
    if (clears(F.top)) continue;      // it clears as dealt
    // the highest height from which it clears: a lower start makes the bead smaller at every height, so what clears from one height clears
    // from any lower one, and halving finds the highest (24 halvings: 240 m down to a hundredth of a millimetre)
    let lo = 0, hi = F.top;
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (clears(m)) lo = m; else hi = m; }
    d.top = lo;
  }
  await ctx.yield();
}

// ================================================================ (repair 3) THE SHOWER OVER THE FIRST VALLEY
// The brief: 'Showers hang in it as three or four loose curtains of slow dark beads with nothing above them: the drops simply come
// out of the cream.' Over the floor of the first valley, the ground the course comes down between the Bowl and the Great Jar, three
// or four curtains of large drops hang: each has a centre drawn on that floor, a direction and a spread drawn with it, and its
// columns are scattered round the centre. A column stands where it stands, whatever the eye does. Its only reference to the course
// is a keep-out margin: none nearer in plan than 34 m (the margin the valley's large drops had) to any eye of the route, eyes every
// EYE_STEP metres; no upper bound. It stands clear of every pot, strap and wall by 10 m. Every column falls through the same band
// of heights, from the top of the Great Jar's blue band to the tray. The stream is its own: nothing else is dealt anew by it.
const JAR_BAND_TOP = 260;                          // metres above the tray: the top of the Great Jar's blue band (the pot of buildJarFrieze has the same figure)
const GROVE_WEST = 75, GROVE_NORTH = 1220;         // the grove's ground: buildGrove deals its trees from x 75 east and from z 1220 south (the same figures, read there)
async function buildValleyRain(ctx, state) {
  const { style, scene, detail, pots } = state, rv = ctx.core.makeRng(ctx.core.hashSeed('fd-valley-rain:' + ctx.seed));
  // THE GROUND, named by the things that stand round it (the nine near pots in the order buildLesser makes them: the Bowl, the Bottle,
  // a jug, the tall vase left of the Jar's tree): from the tall vase east to the west edge of the grove's ground, and from the Bottle,
  // which stands at the foot of the Jar's wall, north to the Bowl. A curtain's CENTRE is drawn inside it; its columns go where its
  // spread takes them, but none into the grove's ground: the shower is the valley's, and the grove stands as it stood.
  const [bowl, bottle, , vaseW] = state.nearPots, X0 = vaseW.x, X1 = GROVE_WEST, Z0 = bottle.z, Z1 = bowl.z;
  // clear by m metres of the Jar's wall (it never reaches beyond 716 m from its axis: the petals' own figure), of every other pot's
  // widest girth, and by 12 m (the lens beads' own figure) of every strap that stands off a shoulder
  const clear = (x, z, m) => Math.hypot(x, z) > 716 + m && !(x > GROVE_WEST && z < GROVE_NORTH) && !pots.some((q, i) => i > 0 && Math.hypot(x - q.x, z - q.z) < q.R + m)
    && !state.straps.some((h) => Math.hypot(x - h.x, z - h.z) < 12) && !state.handle.some((h) => Math.hypot(x - h.x, z - h.z) < 12);
  // how many: about twice the nine columns the valley had and the 74 or so of the round before this one together (a plain number)
  const nCur = rv.chance(0.5) ? 3 : 4, want = Math.round(166 * (0.7 + 0.3 * detail)), cols = [];
  for (let c = 0; c < nCur; c++) {
    let cx = 0, cz = 0;
    // a centre on the open floor: one curtain to each third (or quarter) of the valley's length, from the Bottle north to the Bowl
    for (let t = 0; t < 40; t++) { cx = rv.range(X0, X1); cz = Z0 + (Z1 - Z0) * (c + rv()) / nCur; if (clear(cx, cz, 10)) break; }
    // a loose sheet: 200 to 320 m long, its drops straying 40 to 70 m to either side (plain numbers; the far curtains are 240 to 420 m long and tighter)
    const ang = rv.range(0, Math.PI), len = rv.range(200, 320), wid = rv.range(40, 70), per = Math.round(want * (c + 1) / nCur) - Math.round(want * c / nCur);
    for (let t = 0, n = 0; t < per * 12 && n < per; t++) {
      // and loose: one column in four (a plain number) has left its sheet and stands by itself anywhere on the valley's ground, so
      // that no part of the valley is without rain on any seed (with every column in a sheet, one seed in forty had none for 100 m of the route)
      const stray = rv.chance(0.25), a = stray ? rv.range(X0, X1) : rv.range(-0.5, 0.5) * len, b = stray ? rv.range(Z0, Z1) : rv.gauss() * wid;
      const x = stray ? a : cx + Math.cos(ang) * a - Math.sin(ang) * b, z = stray ? b : cz + Math.sin(ang) * a + Math.cos(ang) * b;
      const r = rv.range(1.7, 3.1), v = rv.range(13, 19), ph = rv();      // radius and fall speed: the valley's and the strike's ranges together
      if (!clear(x, z, 10) || state.courseDist(x, z) < 34 || cols.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) continue;      // and no two columns within 12 m: two large drops' breadth apart
      cols.push({ x, z, r, v, ph }); n++;
    }
    await ctx.yield();
  }
  for (const c of cols) { c.trail = trailSteps(state.trails, c.x, c.z, c.r); if (c.trail) await ctx.yield(); }      // (d1b) where each line stands by the worm trails, once (the lens columns' own text)
  const N = 4;                                     // beads to a column: one every 65 m of its fall, as close as the round before had them
  const mesh = new THREE.InstancedMesh(style.beadGeometry(), style.bead(), Math.max(cols.length * N, 1)), m4 = new THREE.Matrix4();
  mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
  state.updaters.push((dt, time, camera, u, cp) => {
    let k = 0;
    for (const c of cols) {
      // a bead too far off to be seen as a drop is not there (the tied beads' own rule: gone between 75 and 95 times its radius from the lens)
      const far0 = 1 - smoothstep(c.r * 75, c.r * 95, Math.hypot(c.x - cp.x, c.z - cp.z));
      for (let j = 0; j < N; j++) {
        const f = ((time * c.v + (c.ph + j / N) * JAR_BAND_TOP) % JAR_BAND_TOP) / JAR_BAND_TOP;      // 0 at the top: it comes out of the cream there and lands on the tray
        // (d1) it falls at its full size until its foot (its centre less its own half height) is on the tray, and is not drawn below that: no dwindling over the tray
        // (d1b) the touch is of the ball at its DRAWN size sx, on the tray or on a drawn trail (beadGone, the lens columns' own text)
        const y = JAR_BAND_TOP * (1 - f), sx = far0 * c.r * smoothstep(0, 0.08, f) * (0.75 + 0.25 * ((j * 7 + 3) % 5) / 4), s = beadGone(c, y, sx) ? 0 : sx;
        m4.makeScale(s, s * FALL_STRETCH, s); m4.setPosition(c.x, y, c.z); mesh.setMatrixAt(k++, m4);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
}

// ================================================================ the rare visit: a second great drop, 330 m along the wall
// It lands directly ahead of the climb, its tree grows back toward us, and the two crowns meet under the lug in one blot.
async function buildSecond(ctx, state) {
  if (!state.rare) return;
  const { style, scene, rng, hero } = state, r2 = rng.fork('second'), X2 = LUG.x + 105, T0 = 0.55, T1 = 0.66;
  const v = new THREE.Vector3(), nn = new THREE.Vector3();
  const surf = (x, y, out) => { hero.wallPoint(x, y, 0.12, v); hero.wallNormal(x, y, nn); out[0] = v.x; out[1] = v.y; out[2] = v.z; out[3] = nn.x; out[4] = nn.y; out[5] = nn.z; return out; };
  const speeds = [67, 24, 20, 15, 15, 15];
  const br = await style.growDendrite(r2, {
    x: X2, y: 54, len: 190, hw: 4.2, heading: r2.range(-0.12, 0.02), orders: 4, habit: state.habit, clear: 0.16,
    segs: [44, 18, 11, 7, 4], kids: [13, 9, 6, 4], cell: 1.1, ratio: [0.86, 0.7, 0.7, 0.7, 0.7, 0.7],
    bounds: { x0: X2 - 70, x1: X2 + 120, y0: 48, y1: 241 }, budget: Math.round(6000 * (0.6 + 0.4 * state.detail)), yield: ctx.yield, speed: (o) => speeds[o],
  });
  // its runner: one limb that goes down the wall toward us and stops under the lug, where the first tree's runner ends
  const meet = { x: LUG.x + 34, y: 112 }, from = { x: X2 + 2, y: 118 }, n = 40, pts = new Float32Array((n + 1) * 4), len = Math.hypot(meet.x - from.x, meet.y - from.y);
  for (let i = 0; i <= n; i++) {
    const f = i / n, w = Math.sin(f * Math.PI) * (7 * Math.sin(f * 5.1 + 1) + 3 * Math.sin(f * 13));
    pts.set([lerp(from.x, meet.x, f) + w * 0.35, lerp(from.y, meet.y, f) + w, lerp(1.5, 0.3, f), 3 + 11 * f], i * 4);
  }
  br.push({ order: 2, n: n + 1, pts, speed: len / 11 });
  await ctx.yield();
  const geo = await style.ribbons(br, surf, { yield: ctx.yield });
  geo.boundingSphere = new THREE.Sphere(hero.wallPoint(X2 - 20, 140, 0), 280);
  const mat = style.stain({ hero: true });
  const tree = new THREE.Mesh(geo, mat); tree.renderOrder = 3; scene.add(tree);
  // the drop, and the blot where the two crowns fuse
  const mkDrop = (x, y, r) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 18).rotateX(Math.PI / 2), style.drop({ hero: true }));
    hero.wallNormal(x, y, nn); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nn);
    m.scale.setScalar(r); m.renderOrder = 2; scene.add(m);
    return { m, n: nn.clone(), at: hero.wallPoint(x, y, 0) };
  };
  const d2 = mkDrop(X2, 54, 8), blot = mkDrop(meet.x, meet.y, 4.2);
  blot.m.position.copy(blot.at).addScaledVector(blot.n, 0.3);
  const contact = d2.at.clone().addScaledVector(d2.n, 7.2), rest = d2.at.clone().addScaledVector(d2.n, 0.3);
  state.updaters.push((dt, time, camera, u) => {
    const G = u < T1 ? -1 : 14.5 * clamp((u - T1) / (0.955 - T1), 0, 1);
    mat.uniforms.uGrow.value.set(G, 0, 1, 1);
    const f = clamp((u - T0) / (T1 - T0), 0, 1), sq = smoothstep(T1, T1 + 0.012, u);
    d2.m.visible = u >= T0 - 0.02;
    d2.m.position.copy(contact); d2.m.position.y += 200 * (1 - f); d2.m.position.lerp(rest, sq);
    d2.m.material.uniforms.uDrop.value.set(sq, 1.0 + 0.3 * smoothstep(T1, T1 + 0.06, u), 1, 0);
    const b = smoothstep(0.955, 0.985, u);
    blot.m.visible = b > 0.001;
    blot.m.material.uniforms.uDrop.value.set(1, 0.25 + 1.5 * b, 1, 0);
  });
}

// ================================================================ the Jar's own lesser trees
// An old, dry frieze stands along the foot of its band until the hero's slip front crosses and drowns it (the wall
// is then bare for the great drop); and the shower keeps landing on the wet wall round the climb, small trees for ever.
async function buildJarFrieze(ctx, state) {
  const { style, scene, rng, hero } = state, rj = rng.fork('jarfrieze'), R = 700;
  const v = new THREE.Vector3(), nn = new THREE.Vector3();
  const pot = { R, phase: rj(), noLag: true, edgeAt: (k) => (k === 3 ? 40 : 260),
    surf: (a, y, out, lift = 0) => { hero.wallPoint(a * R, y, lift, v); hero.wallNormal(a * R, y, nn); out[0] = v.x; out[1] = v.y; out[2] = v.z; out[3] = nn.x; out[4] = nn.y; out[5] = nn.z; return out; } };
  // ---- the old frieze, x from -560 to 560 m along the band
  const old = [];
  for (let x = -560; x < 570; x += rj.range(34, 60)) old.push({ a: x / R, L: rj.range(50, 95) * (rj.chance(0.2) ? 1.3 : 1), thin: 0.033, budget: Math.round(350 * (0.6 + 0.4 * state.detail)) });   // bold enough to read as a forest from half a kilometre
  const a = await potTrees(ctx, state, pot, old, rj, state.habit);
  await ctx.yield();
  const og = mergeGeometries(a.geos); for (const g of a.geos) g.dispose();
  await ctx.yield();
  const pos = og.attributes.position, gr = og.attributes.aGrow;
  const pa = pos.array, ga = gr.array;
  for (let i = 0, n = pos.count; i < n; i++) ga[i * 3 + 1] = Math.atan2(pa[i * 3], pa[i * 3 + 2]) * R;        // metres along the band, for the front
  // (polish 2) each tree's root, metres along the band: the wave that goes out from the great tree regrows them (not those under its crown)
  for (let k = 0, vi = 0; k < a.geos.length; k++) { const cnt = a.geos[k].attributes.position.count, xr = old[k].a * R; for (let i = 0; i < cnt; i++) ga[(vi++) * 3 + 2] = (((xr > -75 && xr < 48) || (xr > LUG.x - 34 && xr < LUG.x + 26)) ? 0 : xr); }
  await ctx.yield();      // nor those behind the lug
  // (polish 5) the regrown frieze flowers too: cat's eyes along its twigs, opening after each tree has come back (the wave runs east)
  { const ra = og.attributes.aRib.array, na = og.attributes.normal.array;
    for (let i = 0, n = pos.count, k = 0; i < n; i++) {
      const xr = ga[i * 3 + 2];
      if (ra[i * 4 + 2] < 0 || ra[i * 4 + 1] > 0.55 || ra[i * 4 + 1] < 0 || Math.abs(xr) < 0.5 || ((i * 0.6180339) % 1) > 0.085 * (0.6 + 0.4 * state.detail)) continue;
      const uo = TIMING.strike + 0.012 + (Math.abs(xr) - 40 + ra[i * 4] / 1.1) / 4200 + 0.03, h = (i * 0.754877) % 1;
      state.eyes.push(pa[i * 3] + na[i * 3] * 1.2, pa[i * 3 + 1], pa[i * 3 + 2] + na[i * 3 + 2] * 1.2, 1.5 + 1.5 * h, Math.max(uo, 0.44 + 0.2 * clamp((pa[i * 3] - 80) / 720, 0, 1)) + 0.03 * ((h * 7.1) % 1), h, 0, 0);
      if ((++k % 400) === 0) await ctx.yield();
    } }
  og.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 100, 660), 720);
  const oldMat = style.stain({ hero: true });
  const om = new THREE.Mesh(og, oldMat); om.renderOrder = 3; scene.add(om);
  await ctx.yield();
  // ---- the shower on the wet wall: small clock trees round the pass and the climb, each with its bead
  const small = [], n = Math.round(46 * (0.6 + 0.4 * state.detail));
  for (let i = 0; i < n; i++) {
    const lugSide = i % 2 === 0, x = lugSide ? rj.range(LUG.x + 34, LUG.x + 150) : rj.range(50, 190), y = lugSide ? rj.range(120, 215) : rj.range(110, 227);
    small.push({ a: x / R, y, L: lugSide ? rj.range(10, 26) : rj.range(7, 16), delay: 0, budget: lugSide ? 130 : 70, orders: lugSide ? 3 : 2 });
  }
  const b = await potTrees(ctx, state, pot, small, rj, state.habit);
  await ctx.yield();
  const starts = b.recs.map(() => rj());
  // (polish 6) the shower's small trees round the lug flower too, on the clock: each opens once it has grown and closes before the
  // next front drowns it (only from u 0.5 on, when these trees are there at all: the 2 in the last slot says so)
  for (let k = 0; k < b.geos.length; k++) {
    const A = b.geos[k].attributes, pa = A.position.array, na = A.normal.array, ra = A.aRib.array, nV = A.position.count, L = small[k].L;
    if (L < 9) continue;
    for (let e = 0, per = Math.round((6 + L * 0.5) * (0.6 + 0.4 * state.detail)); e < per; e++) {
      const i = Math.floor((((e + 1) * 0.6180339 + k * 0.37) % 1) * nV), h = ((e + 1) * 0.754877 + k * 0.31) % 1;
      if (ra[i * 4 + 1] > 0.4 || ra[i * 4 + 1] < 0) continue;
      state.eyes.push(pa[i * 3] + na[i * 3] * 0.8, pa[i * 3 + 1], pa[i * 3 + 2] + na[i * 3 + 2] * 0.8, 0.5 + L * (0.035 + 0.03 * h), 0.36 + 0.1 * h, h, starts[k], 2.82);
    }
  }
  const sg = mergeGeometries(b.geos); for (const g of b.geos) g.dispose();
  await ctx.yield();
  const st = sg.attributes.aGrow;
  let vi = 0;
  for (let k = 0; k < b.geos.length; k++) { const cnt = b.geos[k].attributes.position.count; for (let i = 0; i < cnt; i++) st.array[(vi++) * 3 + 1] = starts[k]; }
  sg.boundingSphere = new THREE.Sphere(hero.wallPoint(90, 150, 0), 320);
  const smMat = style.stain(), sm = new THREE.Mesh(sg, smMat); sm.renderOrder = 3; scene.add(sm);
  b.recs.forEach((r, k) => { r.start = starts[k]; r.near = true; r.jar = true; });
  for (const r of b.recs) state.trees.push(r);
  state.updaters.push((dt, time, camera, u) => {
    oldMat.uniforms.uGrow.value.set(1e5, hero.frontAt(u) - 12, 0, 2);      // drowned where the Jar's slip front has passed
    oldMat.uniforms.uRegrow.value = u < TIMING.strike + 0.012 ? -1 : 40 + (u - TIMING.strike - 0.012) * 4200;      // (polish 3) the lesser trees race out along the frieze from the strike
    const k = smoothstep(0.46, 0.54, u);                              // the shower only lands here once the great trunk is up
    sm.visible = k > 0.001; smMat.uniforms.uGrow.value.y = 1 - k;
  });
}

// ================================================================ (polish 3) the forest that stands up out of the burst of slip
// The great strike throws a sheet of wet blue slip out over the tray (the floor's uFlood), and where its beads land the stain
// does what it does on every band, only here it has no wall to lie in: it stands. Each tree is the same flat manganese line
// with its rust edge and wet beaded tips, drawn in two crossed upright planes rooted in the slip, so it is a tree from every
// side; the course flies among their crowns. They stand clear of the line from the valley to the great tree, and of the course.
async function buildGrove(ctx, state) {
  const { style, scene, rng, path, hero } = state, rg = rng.fork('grove'), sk = hero.anchors.strike, C = hero.anchors.portalSeat.position;
  // (polish 5) an ORCHARD, not a thicket: more and smaller trees (70 to 125 m), each whole in frame, standing well clear of the
  // course on both legs, of the lug and of the line from the valley to the great tree. Six dendrites are grown; every tree is
  // one of them turned, scaled and set down (its births shifted so the wood stands up outward from the strike).
  const want = Math.max(20, Math.round(46 * (0.6 + 0.4 * state.detail))), spots = [];
  for (let tries = 0; tries < 2600 && spots.length < want; tries++) {
    const x = rg.range(75, 860), z = rg.range(640, 1220), L = rg.range(62, 120), th = rg.range(0, Math.PI);
    const dw = Math.hypot(x, z) - 700, nr = path.nearestXZ(x, z);
    if (x < 190 && z < 960) continue;                  // the great tree stands clear from the strike's side
    if (dw < 55 || dw > 560 || nr.dist < 0.36 * L + 26) continue;      // the nearest twig is 26 m from the lens
    if (Math.hypot(x - C.x, z - C.z) < 105 || (x < C.x + 40 && z < C.z + 150 && x > C.x - 120)) continue;      // nothing beside, behind or just beyond the lug
    if (state.pots.some((q) => Math.hypot(x - q.x, z - q.z) < q.R + 0.3 * L + 14) || spots.some((q) => Math.hypot(x - q.x, z - q.z) < 0.26 * (L + q.L) + 16)) continue;
    spots.push({ x, z, L, th, delay: 7 * clamp((Math.hypot(x - sk.x, z - sk.z) - 140) / 700, 0, 1) });
  }
  const NP = 6, PL = 100, sp = [PL / 3, PL / 4.5, PL / 6, PL / 8], protos = [];
  for (let k = 0; k < NP; k++) {
    const br = await style.growDendrite(rg, { x: 0, y: 0, len: PL, hw: PL * 0.021, heading: rg.range(-0.08, 0.08), orders: 3, habit: state.habit, clear: rg.range(0.22, 0.32),
      segs: [20, 12, 8, 5], kids: [11, 7, 4], ratio: [rg.range(0.7, 0.84), 0.7, 0.7, 0.7], cell: PL / 80, minHw: 0.16, minLen: PL * 0.035,
      bounds: { x0: -PL * 0.36, x1: PL * 0.36, y0: -1, y1: PL * 1.04 }, budget: Math.round(330 * (0.6 + 0.4 * state.detail)), speed: (o) => sp[o], yield: ctx.yield });
    await ctx.yield();
    const gs = [], tips = [];
    for (let j = 0; j < 2; j++) {
      const a = j * 1.45, c = Math.cos(a), sn = Math.sin(a), m = j ? -1 : 1;
      gs.push(await style.ribbons(br, (x, y, out) => { out[0] = c * x * m; out[1] = y + 0.4; out[2] = sn * x * m; out[3] = -sn; out[4] = 0; out[5] = c; return out; }, { yield: ctx.yield }));
      // where the cat's eyes open: the tips of the twigs and half way along them (x, y, z, birth)
      for (const b of br) if (b.order >= 2 && b.pts[(b.n - 1) * 4 + 1] > 0.3 * PL) for (const i of (b.order === 3 ? [b.n - 1] : [b.n - 1, b.n >> 1])) tips.push(c * b.pts[i * 4] * m, b.pts[i * 4 + 1] + 0.4, sn * b.pts[i * 4] * m, b.pts[i * 4 + 3]);
      await ctx.yield();
    }
    const g = mergeGeometries(gs); for (const x of gs) x.dispose();
    protos.push({ g, tips });
    await ctx.yield();
  }
  const mat = style.stain({ hero: true, free: true });
  const eyes = [];                                    // every blossom: x, y, z, radius, the u at which it opens, seed
  const uWave = (x) => 0.44 + 0.2 * clamp((x - 80) / 720, 0, 1), uBorn = (b) => TIMING.strike + 0.012 + (b + 0.5) / 110;
  // every group of six trees is written straight into one geometry (no clone, no merge: those were a quarter of the build)
  const NAMES = [['position', 3], ['normal', 3], ['aLat', 3], ['aRib', 4], ['aGrow', 3], ['aLag', 1]];
  for (let i0 = 0; i0 < spots.length; i0 += 6) {
    const grp = spots.slice(i0, i0 + 6).map((t) => ({ t, pr: protos[Math.floor(rg() * NP) % NP] }));
    let nV = 0, nI = 0;
    for (const q of grp) { nV += q.pr.g.attributes.position.count; nI += q.pr.g.index.count; }
    const out = {}, idx = new Uint32Array(nI);
    for (const [name, sz] of NAMES) out[name] = new Float32Array(nV * sz);
    let v0 = 0, q0 = 0;
    for (const { t, pr } of grp) {
      const s = t.L / PL, c = Math.cos(t.th), sn = Math.sin(t.th), A = pr.g.attributes, n = A.position.count, si = pr.g.index.array;
      for (const [name, tr] of [['position', 1], ['normal', 0], ['aLat', 0]]) {
        const S = A[name].array, D = out[name], k = tr ? s : 1;
        for (let i = 0, o = v0 * 3; i < n * 3; i += 3, o += 3) { const x = S[i], z = S[i + 2]; D[o] = (c * x + sn * z) * k + tr * t.x; D[o + 1] = S[i + 1] * k; D[o + 2] = (-sn * x + c * z) * k + tr * t.z; }
      }
      const R = A.aRib.array, G = A.aGrow.array, DR = out.aRib, DG = out.aGrow;
      for (let i = 0, o = v0 * 4; i < n * 4; i += 4, o += 4) { DR[o] = R[i] + t.delay; DR[o + 1] = R[i + 1] * s; DR[o + 2] = R[i + 2]; DR[o + 3] = R[i + 3] + t.delay; }
      for (let i = 0, o = v0 * 3; i < n * 3; i += 3, o += 3) { DG[o] = G[i] * s; DG[o + 1] = G[i + 1]; DG[o + 2] = G[i + 2]; }
      for (let i = 0; i < si.length; i++) idx[q0 + i] = si[i] + v0;
      v0 += n; q0 += si.length;
      const nT = pr.tips.length / 4, nE = Math.round(200 * (0.6 + 0.4 * state.detail));      // (polish 6) dense: a crown in flower is more blossom than twig
      for (let e = 0; e < nE; e++) {
        const o = Math.floor(rg() * nT) * 4, x = pr.tips[o], z = pr.tips[o + 2];
        eyes.push((c * x + sn * z) * s + t.x, pr.tips[o + 1] * s, (-sn * x + c * z) * s + t.z, s * rg.range(1.7, 2.9) * (e % 12 === 0 ? 1.6 : 1),
          Math.max(uWave(t.x), uBorn(pr.tips[o + 3] + t.delay)) + rg.range(0, 0.02), rg(), 0, 0);
      }
      await ctx.yield();
    }
    const g = new THREE.BufferGeometry();
    for (const [name, sz] of NAMES) g.setAttribute(name, new THREE.BufferAttribute(out[name], sz));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    await ctx.yield();
  }
  for (const pr of protos) pr.g.dispose();
  state.groveSpots = spots; for (const e of eyes) state.eyes.push(e);
  // the burst: the strike throws its beads out over the tray, and where each one lands a tree stands up
  const nx = 16, land = spots.filter((t) => t.z < 940 || t.x > 430).map((t) => ({ x: t.x, z: t.z, d: t.delay, r: rg.range(4, 6), h: rg.range(70, 150) }));   // (polish 5) none thrown over the lens
  for (let i = 0; i < nx; i++) { const a = rg.range(-1.25, 1.25), d = rg.range(120, 250); land.push({ x: sk.x + Math.sin(a) * d, z: sk.z + Math.cos(a) * d, d: 7 * d / 620, r: rg.range(2.5, 5), h: rg.range(50, 170) }); }
  const burst = new THREE.InstancedMesh(style.beadGeometry(), style.bead(), land.length), m4 = new THREE.Matrix4();
  burst.frustumCulled = false; burst.renderOrder = 4; burst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(burst);
  const u0 = TIMING.strike + 0.003, nS = hero.anchors.strikeNormal;
  state.updaters.push((dt, time, camera, u) => {
    mat.uniforms.uGrow.value.set(u < TIMING.strike + 0.012 ? -1 : (u - TIMING.strike - 0.012) * 110, 0, 1, 1);
    for (let i = 0; i < land.length; i++) {
      const b = land[i], f = clamp((u - u0) / (0.009 + b.d / 110), 0, 1), s = (f > 0 && f < 1) ? b.r * smoothstep(0, 0.1, f) : 0;
      m4.makeScale(s, s * (1.05 + 0.5 * f), s);
      m4.setPosition(lerp(sk.x + nS.x * 24, b.x, f), lerp(sk.y + 20, 2, f) + b.h * 4 * f * (1 - f), lerp(sk.z + nS.z * 24, b.z, f));
      burst.setMatrixAt(i, m4);
    }
    burst.instanceMatrix.needsUpdate = true;
  });
}

// ================================================================ (polish 5) THE BLOOM: the ware's other marks
// Mocha ware has more than the dendrite. Where the grove has stood up out of the slip the potter's other slips come: CAT'S EYES,
// three colours dropped one in another (rust-orange, cream, dark), open along the twigs like blossom, crown after crown in a wave
// that runs east ahead of us; and an EARTHWORM trail, three slips laid side by side from one cup, winds over the flooded tray
// between the trunks, under the course, to the lug. All flat slip with a drawn edge: no shading, no shadow.
const EYE_VS = /* glsl */`
uniform float uU, uTime, uResY, uPale; uniform vec3 uCream;
attribute vec3 aPos; attribute vec3 aEye;            // radius m, the u at which it opens, seed
attribute vec2 aClk;                                 // (polish 6) a blossom on a clock tree: the tree's start phase, and the lap phase by which it has closed (0: opens on u)
varying vec2 vP; varying vec3 vK;                    // vK: seed, pale, pixels across
void main(){
  float ph = fract(uTime / 24. + aClk.x), shut = fract(aClk.y), kq = smoothstep(aEye.y, aEye.y + 0.05, ph) * (1. - smoothstep(shut - 0.035, shut, ph));
  if (aClk.y > 1.5) kq *= smoothstep(0.5, 0.56, uU);
  float k = aClk.y > 0. ? kq : clamp((uU - aEye.y) / 0.012, 0., 1.), s = k * (1. + 0.3 * sin(k * 3.14159));      // it opens with a little swell, as a dropped slip spreads
  vec4 mv = viewMatrix * vec4(aPos, 1.);
  float dist = length(mv.xyz), mpp = dist * 2. / (max(projectionMatrix[1][1], 0.01) * max(uResY, 1.));
  float r = max(aEye.x * s, 2.2 * mpp) * step(0.001, k);
  r *= 1. + 0.04 * sin(uTime * 0.8 + aEye.z * 40.);
  mv.xy += position.xy * r; mv.z += min(2.5, 0.2 * dist);
  vP = position.xy; vK = vec3(aEye.z, clamp(uPale * (1. - exp(-dist / 900.)), 0., 1.), 2. * r / max(mpp, 1e-4));
  gl_Position = projectionMatrix * mv;
}`;
const EYE_FS = /* glsl */`
uniform vec3 uCream, uOrange, uDark, uOchre; uniform float uTime, uRound;
varying vec2 vP; varying vec3 vK;
void main(){
  float sd = vK.x * 6.2831853, a = 3. / max(vK.z, 3.);          // a: one and a half pixels, in the disc's own units
  float th = atan(vP.y, vP.x + 1e-5) + uTime * (0.2 + 0.25 * fract(vK.x * 13.7)) * sign(fract(vK.x * 5.1) - 0.5), r0      // each one turns slowly, as a dropped slip still does
    = length(vP) / (0.85 + (1. - uRound) * (0.13 * cos(th * 5. + sd) + 0.02 * sin(th * 3. - sd * 2.)));      // five lobes: a dropped slip that reads as a blossom (uRound 1, repair 3: a plain round dot of slip, a cat's eye on the ware)
  if (r0 > 1.) discard;
  vec2 c1 = 0.12 * vec2(cos(sd), sin(sd)), c2 = c1 + 0.1 * vec2(cos(sd * 3.3 + 0.2 * sin(uTime * 0.5 + sd)), sin(sd * 3.3));
  float r1 = length(vP - c1) / 0.5, r2 = length(vP - c2) / 0.2;
  float flip = step(0.72, fract(vK.x * 7.3));                   // one in four is cream outside, rust within
  vec3 cO = mix(uOrange, uCream, flip), cM = mix(uCream, uOrange, flip);
  cO = mix(cO, uOchre, step(0.8, fract(vK.x * 3.7)) * (1. - flip) * (1. - uRound));      // (polish 6) one in six is ochre slip (never a round dot on the ware: those keep to rust-orange, cream and dark)
  vec3 col = mix(cM, cO, smoothstep(1. - a, 1. + a, r1));
  col = mix(uDark, col, smoothstep(1. - 2. * a, 1. + 2. * a, r2));
  float lw = max(0.07, 1.4 * a);
  col = mix(col, uDark, smoothstep(1. - lw - a, 1. - lw + a, r0) * clamp(vK.z / 7. - 0.4, 0., 1.));      // the drawn edge, once it is big enough to carry one
  gl_FragColor = vec4(mix(col, uCream, vK.y * 0.8), 1.);
}`;
const TRAIL_VS = /* glsl */`
attribute vec3 aT;                                   // metres along, across -1..1, half width m
varying vec3 vT; varying vec3 vW;
void main(){ vT = aT; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const TRAIL_FS = /* glsl */`
uniform vec3 uCream, uOrange, uDark; uniform float uLen, uPale, uTime;
varying vec3 vT; varying vec3 vW;
void main(){
  float s = vT.x, v = vT.y, hw = max(vT.z, 0.1), a = max(fwidth(v), 1e-4);
  float dTip = min(uLen - s, s) / hw;                           // both ends are round, the running end a wet bead
  if (dTip < 0.) discard;
  float lim = dTip < 1. ? sqrt(max(1. - (1. - dTip) * (1. - dTip), 0.)) : 1.;
  if (abs(v) > lim) discard;
  // three slips from one cup, laid side by side; the hand turns the cup, so they cross over each other as they go
  float w = v + 0.24 * sin(s * 0.043 - uTime * 0.25) + 0.07 * sin(s * 0.19 + 1.);      // (polish 6) still wet: the three slips creep over one another
  vec3 col = mix(uOrange, uCream, smoothstep(-0.3 - a, -0.3 + a, w));
  col = mix(col, uDark, smoothstep(0.3 - a, 0.3 + a, w));
  float lw = max(0.09, 1.5 * a);
  col = mix(col, uDark, smoothstep(lim - lw - a, lim - lw + a, abs(v)));
  float dist = length(vW - cameraPosition);
  gl_FragColor = vec4(mix(col, uCream, clamp(uPale * (1. - exp(-dist / 900.)), 0., 1.) * 0.8), 1.);
}`;
// (polish 6) PETALS: where the grove is in flower its slips come loose and fall: flat petals of rust-orange, ochre and cream, each
// inside a drawn edge, tumbling down through the air between the crowns. None within 14 m of the lens, none too far to be a petal.
const PETAL_VS = /* glsl */`
uniform float uU, uTime, uResY;
attribute vec3 aPos; attribute vec4 aSeed;           // fall speed m/s, phase, half length m, the u at which the trees here flower
varying vec2 vP; varying vec2 vK;
void main(){
  float T = uTime * 0.6667, H = 170., ph = fract(aSeed.y + T * aSeed.x / H);
  vec3 p = aPos;
  p.y = H * (1. - ph) - 6.;
  p.x += 10. * sin(T * 0.45 + aSeed.y * 40.) + 16. * ph; p.z += 8. * sin(T * 0.33 + aSeed.y * 23.);
  float k = smoothstep(aSeed.w, aSeed.w + 0.035, uU) * smoothstep(0., 0.05, ph) * (1. - smoothstep(0.95, 1., ph));
  vec4 mv = viewMatrix * vec4(p, 1.);
  float dist = length(mv.xyz), mpp = dist * 2. / (max(projectionMatrix[1][1], 0.01) * max(uResY, 1.));
  k *= smoothstep(16., 34., dist) * (1. - smoothstep(190., 260., dist));
  k *= smoothstep(2.6, 4.2, aSeed.z / max(mpp, 1e-4));                          // a petal too small to be seen as a petal is not there: no specks
  vec4 cc = projectionMatrix * mv; vec2 nd = abs(cc.xy) / max(cc.w, 1e-3);
  k *= 1. - smoothstep(0.8, 0.95, max(nd.x, nd.y));                             // and none is cut by the frame's edge
  float r = aSeed.z * k, a = T * (0.9 + aSeed.y) + aSeed.y * 60.;
  vec2 q = position.xy; q.x *= 0.62 + 0.38 * abs(cos(a * 0.8));                 // it turns edge-on as it tumbles
  float c = cos(a * 0.35), sn = sin(a * 0.35);
  mv.xy += vec2(c * q.x - sn * q.y, sn * q.x + c * q.y) * r;
  vP = position.xy; vK = vec2(aSeed.y, 2. * r / max(mpp, 1e-4));
  gl_Position = projectionMatrix * mv;
}`;
const PETAL_FS = /* glsl */`
uniform vec3 uCream, uOrange, uDark, uOchre;
varying vec2 vP; varying vec2 vK;
void main(){
  float a = 3. / max(vK.y, 3.);
  float w = 0.62 * sqrt(max(1. - vP.y * vP.y, 0.)) * (0.62 + 0.38 * vP.y);     // a petal: round at the top, drawn to a point at the foot
  float d = abs(vP.x) - w;
  if (d > 0. || abs(vP.y) > 1.) discard;
  float h = fract(vK.x * 9.7);
  vec3 col = h < 0.45 ? uOrange : h < 0.7 ? uCream : uOchre;
  col = mix(col, h < 0.45 ? uCream : uOrange, 1. - smoothstep(-0.55 - a, -0.55 + a, vP.y));      // the heart of the flower it fell from
  float lw = max(0.07, 1.1 * a);
  col = mix(col, uDark, smoothstep(-lw - a, -lw + a, d) * clamp(vK.y / 12. - 0.5, 0., 1.));      // a drawn edge only when it is large enough to carry one
  gl_FragColor = vec4(col, 1.);
}`;
// (repair 3) a cat's-eye disc lying in a surface: a quad with the eye's own drawing (EYE_FS), round
const DISC_VS = /* glsl */`
uniform float uResY, uPale;
attribute vec2 aQ; attribute vec2 aS;                // corner -1..1; seed, radius m
varying vec2 vP; varying vec3 vK;
void main(){
  vec4 mv = viewMatrix * vec4(position, 1.);
  float dist = length(mv.xyz), mpp = dist * 2. / (max(projectionMatrix[1][1], 0.01) * max(uResY, 1.));
  vP = aQ; vK = vec3(aS.x, clamp(uPale * (1. - exp(-dist / 900.)), 0., 1.), 2. * aS.y / max(mpp, 1e-4));
  gl_Position = projectionMatrix * mv;
}`;
async function buildBloom(ctx, state) {
  const { style, scene, path, hero } = state, U = style.uniforms, eyes = state.eyes, n = eyes.length / 8;
  const night = state.hour === 'night';
  const cols = { uOrange: U.uOrange, uDark: U.uDark, uOchre: { value: new THREE.Color(night ? '#8A6A34' : '#E3A42F') } };
  // ---- the cat's eyes: one lens-facing disc each, drawn in the material
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aEye = new Float32Array(n * 3), aClk = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const o = i * 8; aPos[i * 3] = eyes[o]; aPos[i * 3 + 1] = eyes[o + 1]; aPos[i * 3 + 2] = eyes[o + 2]; aEye[i * 3] = eyes[o + 3]; aEye[i * 3 + 1] = eyes[o + 4]; aEye[i * 3 + 2] = eyes[o + 5]; aClk[i * 2] = eyes[o + 6]; aClk[i * 2 + 1] = eyes[o + 7]; if (i % 1500 === 1499) await ctx.yield(); }
  g.setAttribute('aClk', new THREE.InstancedBufferAttribute(aClk, 2));
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3)); g.setAttribute('aEye', new THREE.InstancedBufferAttribute(aEye, 3));
  g.instanceCount = n;
  const eyeMat = new THREE.ShaderMaterial({ uniforms: { uU: { value: 0 }, uTime: U.uTime, uRound: { value: 0 }, uResY: U.uResY, uPale: U.uPale, uCream: U.uCream, ...cols }, vertexShader: EYE_VS, fragmentShader: EYE_FS });
  const em = new THREE.Mesh(g, eyeMat); em.frustumCulled = false; em.renderOrder = 5; scene.add(em);
  await ctx.yield();
  // ---- the earthworm trail: a ribbon on the tray, left of the course from the strike's burst round the grove to the lug
  const N = 340, U0 = 0.445, U1 = 0.972, cen = [], p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const u = lerp(U0, U1, i / N); path.pointAt(u, p); path.tangentAt(u, t);
    const l = Math.hypot(t.x, t.z) || 1, lx = t.z / l, lz = -t.x / l, d0 = (u - U0) * path.length;
    const off = (30 + 26 * Math.sin(d0 * 0.057) + 6 * Math.sin(d0 * 0.19 + 2)) * (1 - smoothstep(0.9, 0.972, u));
    cen.push([p.x + lx * off, p.z + lz * off]);
  }
  const ribbon = (cen, HW) => {
    const N = cen.length - 1, pos = new Float32Array((N + 1) * 6), aT = new Float32Array((N + 1) * 6), idx = [];
    let sLen = 0;
    for (let i = 0; i <= N; i++) {
      const a = cen[Math.max(i - 1, 0)], b = cen[Math.min(i + 1, N)], c = cen[i];
      if (i > 0) sLen += Math.hypot(c[0] - cen[i - 1][0], c[1] - cen[i - 1][1]);
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l;
      for (let k = 0; k < 2; k++) { const sgn = k ? 1 : -1, o = (i * 2 + k) * 3; pos.set([c[0] + nx * HW * sgn, TRAIL_TOP, c[1] + nz * HW * sgn], o); aT.set([sLen, sgn, HW], o); }
      if (i > 0) { const q = i * 2; idx.push(q - 2, q - 1, q + 1, q - 2, q + 1, q); }
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); tg.setIndex(idx);
    return { tg, sLen };
  };
  const { tg, sLen } = ribbon(cen, 13);
  const trailMat = new THREE.ShaderMaterial({ uniforms: { uLen: { value: 0 }, uPale: U.uPale, uCream: U.uCream, uTime: U.uTime, ...cols }, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, side: THREE.DoubleSide });
  const tm = new THREE.Mesh(tg, trailMat); tm.frustumCulled = false; tm.renderOrder = 1; scene.add(tm);
  state.trails = [{ g: tg, len: trailMat.uniforms.uLen, full: sLen }];      // (d1b) the ribbons that lie on the tray, for the beads' touch (trailSteps): each one's own geometry, its own laid length (the uniform) and its full length
  await ctx.yield();
  // (polish 6) THE OLD TRAILS: the potter's earthworm was laid on the tray before we came. Two of them wind down the first valley
  // between the pots, from behind the entry past the Pitcher and the Bowl to the foot of the Great Jar, so the tray is a
  // decorated ground with a way through it from the first still on (the new one, above, is laid under us through the grove).
  const sk = hero.anchors.strike;
  for (const [ctl, hw] of [
    [[[-205, 1900], [-285, 1760], [-250, 1640], [-292, 1530], [-268, 1420], [-282, 1300], [-262, 1185], [-150, 1118], [-52, 1128], [22, 1060], [-8, 960], [-62, 880], [-28, 800], [30, 752], [sk.x + 6, sk.z + 22]], 12],
    [[[190, 1880], [70, 1760], [118, 1640], [42, 1530], [86, 1440], [30, 1352], [14, 1262], [34, 1178], [120, 1096], [236, 1108], [300, 1190], [420, 1180], [520, 1262], [660, 1250], [790, 1330], [960, 1300]], 11]]) {
    const pts = new THREE.CatmullRomCurve3(ctl.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal').getSpacedPoints(150).map((q) => [q.x, q.z]);
    const r = ribbon(pts, hw);
    const m = new THREE.Mesh(r.tg, new THREE.ShaderMaterial({ uniforms: { uLen: { value: r.sLen }, uPale: U.uPale, uCream: U.uCream, uTime: U.uTime, ...cols }, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, side: THREE.DoubleSide }));
    m.frustumCulled = false; m.renderOrder = 1; scene.add(m); state.trails.push({ g: r.tg, len: m.material.uniforms.uLen, full: r.sLen });
    await ctx.yield();
  }
  // ---- (repair 3) THE BOWL'S FLOOR carries the ware's slip marks (strangers called its bare honey disc 'unfinished'): a ring of nine
  // large cat's-eye discs, six smaller inside it, and a coil of earthworm trail at the centre, all lying in the honey of the floor.
  // The same three slips as the blossom and the trails (rust-orange, cream, dark brown: the same uniforms), no brighter, no further
  // colour. They are marks on the ware, not flowers: they lie there the whole flight. Sizes and places are shares of the Bowl's rim.
  if (state.bowlRim) {
    const fb = ctx.core.makeRng(ctx.core.hashSeed('fd-bowl-marks:' + ctx.seed)), rim = state.bowlRim, H = BOWL.H;
    // the height of the Bowl's floor at r metres from its axis (the rows bowlInside lays inside the blue band's lower pinstripe)
    const yF = (r) => (r <= 0.14 * rim ? lerp(0.24, 0.246, r / (0.14 * rim)) : r <= 0.3 * rim ? lerp(0.246, 0.262, (r - 0.14 * rim) / (0.16 * rim)) : lerp(0.262, 0.31, clamp((r - 0.3 * rim) / (0.14 * rim), 0, 1))) * H;
    const pos = [], aQ = [], aS = [], idx = [];
    const disc = (r, a, R) => {
      const sl = (yF(r + 1) - yF(r - 1)) / 2, l = Math.hypot(1, sl), er = [Math.sin(a) / l, sl / l, Math.cos(a) / l], et = [Math.cos(a), 0, -Math.sin(a)], seed = fb(), v0 = pos.length / 3;
      const c = [BOWL.x + r * Math.sin(a), yF(r) + 0.7, BOWL.z + r * Math.cos(a)];
      for (const [qx, qy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0] + R * (qx * et[0] + qy * er[0]), c[1] + R * qy * er[1], c[2] + R * (qx * et[2] + qy * er[2])); aQ.push(qx, qy); aS.push(seed, R); }
      idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    };
    const nA = 9, a0 = fb.range(0, TAU);
    for (let i = 0; i < nA; i++) disc(0.32 * rim * fb.range(0.97, 1.03), a0 + (i + fb.range(-0.1, 0.1)) * TAU / nA, 0.088 * rim * fb.range(0.88, 1.08));
    for (let i = 0; i < 6; i++) disc(0.175 * rim * fb.range(0.96, 1.04), a0 + (i + 0.5 + fb.range(-0.12, 0.12)) * TAU / 6, 0.05 * rim * fb.range(0.88, 1.1));
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); dg.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(aQ), 2)); dg.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(aS), 2)); dg.setIndex(idx);
    const dm = new THREE.Mesh(dg, new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uRound: { value: 1 }, uResY: U.uResY, uPale: U.uPale, uCream: U.uCream, ...cols }, vertexShader: DISC_VS, fragmentShader: EYE_FS, side: THREE.DoubleSide }));
    dm.renderOrder = 2; scene.add(dm);
    const coil = [], t0 = fb.range(0, TAU), turn = fb.sign();
    for (let i = 0; i <= 60; i++) { const f = i / 60, r = lerp(0.028, 0.098, f) * rim, a = t0 + turn * f * 3.2 * Math.PI; coil.push([BOWL.x + r * Math.sin(a), BOWL.z + r * Math.cos(a)]); }
    const cr = ribbon(coil, 0.021 * rim), cp = cr.tg.attributes.position;
    for (let i = 0; i < cp.count; i++) cp.setY(i, yF(Math.hypot(cp.getX(i) - BOWL.x, cp.getZ(i) - BOWL.z)) + 0.6);
    const cm = new THREE.Mesh(cr.tg, new THREE.ShaderMaterial({ uniforms: { uLen: { value: cr.sLen }, uPale: U.uPale, uCream: U.uCream, uTime: U.uTime, ...cols }, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, side: THREE.DoubleSide }));
    cm.renderOrder = 2; scene.add(cm);
    await ctx.yield();
  }
  // ---- (polish 6) the petals: along the course through the grove and down the avenue to the lug
  const nP = Math.round(1500 * state.detail), pg = new THREE.InstancedBufferGeometry(), pP = new Float32Array(nP * 3), pS = new Float32Array(nP * 4);
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
  const hh = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };      // no draw from the world's rng
  for (let i = 0; i < nP; i++) {
    const u = 0.47 + 0.5 * hh(i, 1); path.pointAt(u, p); path.tangentAt(u, t);
    const l = Math.hypot(t.x, t.z) || 1, off = (22 + 150 * hh(i, 2) * hh(i, 2)) * (hh(i, 3) < 0.5 ? -1 : 1);
    let x = p.x + (t.z / l) * off, z = p.z - (t.x / l) * off;
    const dw = Math.hypot(x, z) - 716; if (dw < 0) { x *= 1 - dw / 700; z *= 1 - dw / 700; }      // never inside the Jar's wall
    pP[i * 3] = x; pP[i * 3 + 2] = z;
    pS[i * 4] = 5 + 5 * hh(i, 4); pS[i * 4 + 1] = hh(i, 5); pS[i * 4 + 2] = 1.7 + 1.8 * hh(i, 6); pS[i * 4 + 3] = Math.min(0.47 + 0.2 * clamp((x - 80) / 720, 0, 1), u - 0.06);
    if (i % 500 === 499) await ctx.yield();
  }
  pg.setAttribute('aPos', new THREE.InstancedBufferAttribute(pP, 3)); pg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(pS, 4)); pg.instanceCount = nP;
  const petMat = new THREE.ShaderMaterial({ uniforms: { uU: eyeMat.uniforms.uU, uTime: U.uTime, uResY: U.uResY, uCream: U.uCream, ...cols }, vertexShader: PETAL_VS, fragmentShader: PETAL_FS, side: THREE.DoubleSide });
  const pm = new THREE.Mesh(pg, petMat); pm.frustumCulled = false; pm.renderOrder = 6; scene.add(pm);
  state.updaters.push((dt, time, camera, u) => {
    eyeMat.uniforms.uU.value = u;
    trailMat.uniforms.uLen.value = sLen * clamp((u - 0.43) / 0.36, 0, 1);      // it is laid ahead of us, a few hundred metres in front
    state.flood.w = 980 * clamp((u - 0.47) / 0.21, 0, 1);                      // behind the blossom the flood turns from blue to honey
  });
}
