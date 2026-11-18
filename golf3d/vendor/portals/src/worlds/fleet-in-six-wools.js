// "The Crossing, Worked in Wool": after the Bayeux Tapestry. Inside the hanging itself: bare linen everywhere, flat
// laid-and-couched wool standing on it in ranks, two borders of paired beasts between slanted bars, the long-haired
// star breaking the upper one, a fleet of striped sails on a sea that is bare cloth. Nothing is lit; a hex written is
// the hex shown (post flat). +Z is the course; every flat faces back down it, so its own +x is the viewer's right
// (starboard) and world -X. Everything is shaded by the hero's style (src/parts/fleet-in-six-wools.js).
// The ending is worked in full wool like the rest: rank six (z 1,130), the fifth lower border, a landfall gate of two knot
// trees, the landing rank and the arch. What is unfinished shows only as FREE WOOL: long loose ends of terracotta, gold and
// blue-green hanging from the yards of the last ranks and from the last borders, swaying, and one half-worked knot tree
// beside the arch. The birds fly on over all of it.
// More of the lower border's work stands either side of the rail: its fish in the sea among the water lines, confronted
// and swimming on the spot, and its long-necked birds and sprigs on the shore, all frontal and in profile (nothing lies on
// the cloth but the water lines). A skein of great birds crosses over the star's span during the climb. The arch is hung
// with two curtains knotted back round its columns and a scalloped valance.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  buildHero, makeStyle, FlatBuilder, WOOLS, woolColor, smoothLoop, band, lineFor, sprig, slantBars,
  beastLion, beastHound, beastBird, beastWyvern, makeFringe, setSmooth,
} from '../parts/fleet-in-six-wools.js';

const PALETTE = ['#D8CCAE', '#A9462B', '#3E6E69', '#C59A3C', '#6F7A3B', '#3C5C84', '#1E2836'];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const LOTS = {
  terracotta: { lead: ['terracotta', 'bluegreen', 'gold', 'olive', 'blue'], horse: ['blue', 'gold'], horse2: ['terracotta', 'bluegreen'], sail: ['terracotta', 'gold', 'bluegreen'] },
  blue: { lead: ['blue', 'bluegreen', 'terracotta', 'gold', 'olive'], horse: ['gold', 'olive'], horse2: ['blue', 'terracotta'], sail: ['blue', 'buff', 'terracotta'] },
  green: { lead: ['olive', 'sage', 'gold', 'terracotta', 'bluegreen'], horse: ['blue', 'gold'], horse2: ['olive', 'terracotta'], sail: ['terracotta', 'sage', 'gold'] },
};
const CASTS = { lions: [beastLion, beastBird], wyverns: [beastWyvern, beastBird], hounds: [beastHound, beastLion] };
const BARW = ['terracotta', 'bluegreen', 'gold', 'olive', 'blue', 'buff', 'sage'];
const XE = -60;            // the course ends 60 m to starboard of where it began (after the slant across the flagship)
const RANK_Z = [570, 612, 700, 847, 915, 1130];
const DRAWN_Z = 1296;      // the landing rank
const DURATION = 41;
const FLAG_X = 95;         // (the flagship is built SF times its drawing: the one towering thing of the crossing)
const SF = 1.6;
//                         FLAG_X: where the flagship's mast stands (world x, port) as the rail comes to its rank
const STEP_UP = 16;        // metres each far rank stands above the one before (depth is a step up the frame); it settles as we come
const LEAD_AHEAD = 147, LEAD_K = 1.25, LEAD_OFF = 26;   // the great ship beyond rank five: how far beyond, how much larger, how far off the rail
const ARCH_K = 2.1;        // the exit arch is built this much larger than its drawing
const END_Y = 14 + 10.2*ARCH_K;   // the middle of the arch's opening

export default {
  id: 'fleet-in-six-wools',
  name: 'The Crossing, Worked in Wool',
  category: 'artists',
  placeKind: 'ocean',
  after: 'the Bayeux Tapestry, embroidered about 1077',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, (ctx.quality && ctx.quality.detail) || 1));
    const rare = !!(ctx.vary && ctx.vary.rare);
    // ---- the edition: wool lot, weather of the cloth, cast of the borders ----
    const r0 = rng(), r1 = rng(), r2 = rng();
    const lotName = ['terracotta', 'blue', 'green', 'terracotta'][Math.floor(r0*4) % 4];
    const weather = ['draught', 'gale', 'still', 'draught'][Math.floor(r1*4) % 4];
    const castName = r2 < 0.15 ? 'wyverns' : r2 < 0.29 ? 'hounds' : r2 < 0.4 ? 'lions' : r2 < 0.5 ? 'wyverns' : 'lions';
    const lot = LOTS[lotName], cast = CASTS[castName];
    const speedK = weather === 'gale' ? 2 : weather === 'still' ? 0.6 : 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE[0]);
    const style = makeStyle(ctx, { palette: PALETTE, weather });
    const disposables = [];

    // ---- the path (world coordinates; +X is port, the viewer's left) ----
    // Two routes. LAID is the route the world is laid along: the tables below, every key read from them, every thing stood
    // by the route's x at its own z and the birds that fly the route all read it. The EYE flies `path`, which is the laid
    // route but for three knots at the flagship. There the laid route climbs to 77.5 m, just under her yard (81 m), and
    // dives to its foot, [28, 29, 819]: from that climb the picture held her sail and bare linen and no hull, while at
    // the foot her prow beast's head (40 to 50 m up) stands dead ahead over the fleet, a picture to keep (a lower eye
    // there would have the head above the picture). So the eye instead comes down from 37.5 m (at z 761, a knot of both
    // routes) while it swings to port, through a knot 10 m further on (32 m up), to its turn 62 m before her plane
    // (z 847) and 26 m up, 20 to 28 m astern of her mast as she then stands (by the weather); there it turns and crosses
    // before her face to starboard, coming down to 17 m at a knot 48 m before her plane (her rail is 14.7 m up
    // amidships), and rises to the same foot. The direction and shape of the swing are by these places; its AMOUNT (how
    // far to port the middle knot stands, about 126.33 m) is not typed: it is found below so that the eye's route is as
    // long as the laid one (to within 1e-11 m). With that every share of the flight is the same place on both routes
    // outside the stretch from z 753 to z 838: outside it the eye is where the laid route has it (over the last 0.12 m of
    // route before z 753 to within 30 micrometres, where the kit's length table straddles the knot). Its gaze is so only
    // nearly: the engine's camera starts from the direction to a place further down the route it flies (26 m; 88 m on
    // the viewer's steady camera), so the gaze begins to turn toward the pass that far before z 753: by under a
    // hundredth of a degree on the usual camera, whose gaze the four places below hold, by up to 9 degrees on the steady
    // one, which also carries the turn for about three seconds past z 838.
    // The count of knots is the same (the kit lays a route's length table by it).
    const LAID = [
      [0, 16, -28], [0, 16, 14], [0, 13, 50], [0, 14.5, 96], [0, 23, 152], [0, 44, 236], [0, 58, 298], [0, 62, 330],
      [2, 56, 368], [8, 46, 440], [20, 35, 520], [46, 25, 598], [78, 26, 655], [96, 25, 705], [98, 33, 742],
      [95, 36, 753], [97, 37.5, 761], [108, 60, 776], [94, 77, 790], [58, 66, 806], [28, 29, 819], [38, 19, 838], [32, 18, 842], [22, 19.5, 851], [12, 21, 872], [4, 18, 895],
      [2, 16.5, 925], [2, 16.5, 950],
      [-2, 16.5, 972], [-16, 16.5, 1005], [-36, 16.5, 1040], [-52, 17, 1070], [XE, 18, 1110], [XE, 21.5, 1180], [XE, 28, 1290], [XE, END_Y, 1400],
    ];
    const laid = makePath(LAID);
    const CLIMB0 = LAID.findIndex((p) => p[2] === 776);      // the three laid knots of the climb to her yard: z 776, 790, 806
    const eyeWay = (reach) => makePath(LAID.map((p, i) => (i === CLIMB0 ? [112, 32, 771] : i === CLIMB0 + 1 ? [reach, 26, 785] : i === CLIMB0 + 2 ? [84, 17, 799] : p)));
    let path = null;
    {   // the reach to port by the secant rule on the route's length (from a reach of about 98 m on the length grows steadily with the reach, and both starts stand beyond it; five steps or so)
      let ra = 120, da = eyeWay(ra).length - laid.length, rb = 135; path = eyeWay(rb); let db = path.length - laid.length;
      for (let i = 0; i < 10 && Math.abs(db) > 1e-11 && db !== da; i++) { const r = rb - db*(rb - ra)/(db - da); ra = rb; da = db; rb = r; path = eyeWay(rb); db = path.length - laid.length; }
      if (CLIMB0 < 0 || !(Math.abs(db) < 1e-9)) path = laid;   // (a search that did not come home: the eye flies the laid route rather than one of another length)
    }
    // tables: the LAID route's x, y and u at a world z (z never turns back on it)
    const TAB = 400, tz = new Float32Array(TAB + 1), tx = new Float32Array(TAB + 1), ty = new Float32Array(TAB + 1);
    { const v = new THREE.Vector3(); for (let i = 0; i <= TAB; i++) { laid.pointAt(i/TAB, v); tz[i] = v.z; tx[i] = v.x; ty[i] = v.y; } }
    const atZ = (z) => { let i = 0; while (i < TAB - 1 && tz[i + 1] < z) i++; const f = Math.min(1, Math.max(0, (z - tz[i])/Math.max(1e-3, tz[i + 1] - tz[i])));
      return { x: tx[i] + (tx[i + 1] - tx[i])*f, y: ty[i] + (ty[i + 1] - ty[i])*f, u: (i + f)/TAB }; };

    // ---- linen: the dome that is everywhere and the floor cloth that billows ----
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 16, 10), style.linen({ plane: 'xy' }));
    dome.material.depthWrite = false; dome.material.depthTest = false; dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();
    {
      const g = new THREE.PlaneGeometry(1500, 1760, 60, 118); g.rotateX(-Math.PI/2); g.translate(0, 0, 552);
      const floor = new THREE.Mesh(g, style.linen({ plane: 'xz', ride: 1 })); floor.frustumCulled = false; floor.renderOrder = -5; floor.material.polygonOffset = true; floor.material.polygonOffsetFactor = 2; floor.material.polygonOffsetUnits = 8; scene.add(floor);
    }
    await ctx.yield();

    // every standing flat lives in a group turned to face back down the course: local x = -world x, zb = -world z
    const facing = (name) => { const g = new THREE.Group(); g.rotation.y = Math.PI; g.name = name; scene.add(g); return g; };
    const woolStand = style.wool();
    const addFlat = (parent, fb, mat, name) => { const m = new THREE.Mesh(fb.build(), mat || woolStand); m.name = name || 'flat'; m.frustumCulled = false; parent.add(m); return m; };

    // ---- the hero: the long-haired star in the first hung span ----
    // the eye's places through her fringe, in HER frame (she stands at z 330 turned to face back down the course: her x is
    // -world x, her z is 330 - world z), a quarter metre apart from 16 m before the cloth to 16 m beyond: the part trims
    // the arch we fly under about this line, once, here at build
    const eyeAtStar = []; { const v = new THREE.Vector3(), s1 = atZ(346).u*path.length; for (let s = atZ(314).u*path.length; s <= s1; s += 0.25) { path.posAtDist(s, v); eyeAtStar.push(-v.x, v.y, 330 - v.z); } }
    const hero = await buildHero(ctx, { palette: PALETTE, detail, lot: lotName, cast: castName, weather, style, back: false, eye: eyeAtStar });
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 330); scene.add(hero.object);
    await ctx.yield();

    const uS = atZ(330).u, uH = atZ(839).u;
    const uA = atZ(596).u, uW = atZ(748).u, uP = atZ(817).u, uT = atZ(897).u;      // where the rail goes through the star's fringe, and where it is closest to the flagship
    const aheadW = new THREE.Vector3();
    // the gaze during the dive and the hull: straight down the course (so every band is level), pitched down 12 degrees
    // at the top of the dive and nearly level by the flagship
    // by the first ranks; then it lifts to take in the whole flagship, lifts again under her prow beast, comes level beyond,
    // and from the fifth rank on is held 6 degrees up, so the standing work fills the frame and the bare cloth is its foot
    // (the keys are read from the laid route; on the eye's route the second lift begins on the swing to port, 7 m of
    // route before the turn, runs through the crossing before her face and is whole just before the foot, under her beast)
    const gazeDeg = (u) => -12 + 11*sstep(uS + 0.02, uA, u) + 7.8*sstep(uA, uW, u) + 6.2*sstep(uW + 0.03, uP, u) - 13*sstep(uP + 0.006, uT, u) + 6*sstep(uT, uT + 0.045, u);
    const gazeAt = (time, u) => { path.pointAt(u, aheadW); aheadW.y += 320*Math.tan(gazeDeg(u)*Math.PI/180); aheadW.z += 320; return aheadW; };
    style.uniforms.uPx.value.y = 1.5;
    const S = { uS, uH, uW, uP, gazeDeg, scene, style, path: laid, atZ, rng, detail, rare, lot, lotName, cast, castName, weather, speedK, facing, addFlat, woolStand, ctx, disposables };
    const borders = await buildBorders(S);
    const shore = await buildShore(S);
    const fleet = await buildFleet(S);
    const birds = await buildBirds(S);
    const end = await buildEnd(S);
    const parts = [borders, shore, fleet, birds, end];

    const camPos = new THREE.Vector3();
    const headW = new THREE.Vector3(-30, 91, 330);
    return {
      scene, path, duration: DURATION,
      // linger at the star and along the hull, hurry the dive and the stretch where the wool runs out
      pace: (u) => 1 - 0.38*sstep(0.09, 0.15, u)*(1 - sstep(uS, uS + 0.04, u)) + 0.6*sstep(uS + 0.01, uS + 0.08, u)*(1 - sstep(uW - 0.11, uW - 0.03, u))
        - 0.4*sstep(uW - 0.04, uW, u)*(1 - sstep(uH + 0.02, uH + 0.07, u)) + 0.25*sstep(uH + 0.06, uH + 0.12, u)*(1 - sstep(0.82, 0.89, u)),
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 26, sway: 0.4, bank: 0 },
      pois: [
        { at: headW, from: 0.07, to: uS - 0.02, weight: 0.35 },
        // along the hull and through the slant the gaze stays square to the strip (straight down the course) while the eye
        // crosses before her and the rail then slides to starboard: the ranks and borders pass as level bands, never as a
        // row seen along its length
        { at: gazeAt, from: uS - 0.022, to: 0.87, weight: 0.9, fade: 0.045 },
        // (said four times over: the viewer's steady camera heeds a poi at a third of its weight, and the strip must stay square there too)
        { at: gazeAt, from: uS - 0.022, to: 0.87, weight: 0.9, fade: 0.045 },
        { at: gazeAt, from: uS - 0.022, to: 0.87, weight: 0.9, fade: 0.045 },
        { at: gazeAt, from: uS - 0.022, to: 0.87, weight: 0.9, fade: 0.045 },
      ],
      portal: { shape: 'arch', width: 17.6*ARCH_K, height: 20*ARCH_K, color: WOOLS.gold, veil: WOOLS.gold, glow: 0.25, frame: 0, revealDistance: 420, blendDistance: 30 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camPos.setFromMatrixPosition(camera.matrixWorld);
        dome.position.copy(camPos);
        style.update(time, camera, ctx.renderer);
        style.setProgress(u);
        style.uniforms.uCrest.value.y = Math.max(3.2, style.uniforms.uWave.value.x*1.2)*sstep(uS - 0.06, uS + 0.04, u);   // the swell that overtakes us
        // the gust rides the crest: strongest while it passes under the eye
        const dz = (camPos.z - (2600*u - 420))/90;
        style.setGust(0.9*Math.exp(-dz*dz)*sstep(0.2, 0.3, u));
        for (const p of parts) p.update(dt, time, camera, u, camPos);
      },
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};

// ---- a border: two ropes, pairs of slanted bars with a sprig, confronted beasts in two wools that swap -------------
// o: { xa, xb, gap: [g0, g1] | null, y0, h, zb, kind (0 worked, 2 pricked outline), beasts: fb for the beasts or null,
//      ends: [] that receives [x, y, 1] at every bar and beast, where the hand may have left wool hanging }
const VOID_FB = new FlatBuilder();   // work that is not to be seen is laid here and never built
async function bandWork(S, fb, o) {
  const { rng, lot, cast } = S, y0 = o.y0, y1 = o.y0 + o.h, big = o.h > 20;
  fb.at(); fb.zb = o.zb; fb.kind = o.kind || 0;
  const bfb = o.beasts === undefined ? fb : o.beasts;
  if (bfb) { bfb.zb = o.zb; bfb.kind = o.kind || 0; }
  const line = (x0, x1, y) => { const p = [], n = Math.max(1, Math.round(Math.abs(x1 - x0)/6)); for (let i = 0; i <= n; i++) p.push([x0 + (x1 - x0)*i/n, y + 0.1*Math.sin(i*1.7 + y)]); return p; };
  const zones = o.gap ? [[o.gap[0], o.xa, -1], [o.gap[1], o.xb, 1]] : [[o.xa, o.xb, 1]];
  const s = big ? 1.16 : (o.h - 2.6)/21.5, cw0 = 26*s + (big ? 15 : 8.5);
  let bi = rng.int(0, 6), pairI = rng.int(0, 4);
  for (const [zs, ze, sd] of zones) {
    const len = Math.abs(ze - zs), nC = Math.max(1, Math.round(len/cw0)), cw = len/nC;
    const lo = Math.min(zs, ze), hi = Math.max(zs, ze);
    fb.at(); fb.rope(line(lo, hi + 0.6, y0), 'dark', big ? 0.9 : 0.7, { z: 0.1 }); fb.rope(line(lo, hi + 0.6, y1), 'dark', big ? 0.9 : 0.7, { z: 0.1 });
    fb.rope(line(lo, hi, y0 + (big ? 1.5 : 1.0)), 'terracotta', 0.34, { z: 0.1 }); fb.rope(line(lo, hi, y1 - (big ? 1.5 : 1.0)), 'gold', 0.34, { z: 0.1 });
    for (let i = 0; i <= nC; i++) {
      const bx = zs + sd*(i*cw + (i === 0 ? 2.2 : 0) - (i === nC ? 2.2 : 0)), lean = (i % 2 ? -1 : 1)*sd*o.h*0.24;
      const wa = BARW[bi % 7], wb = BARW[(bi + 3) % 7]; bi += rng.int(1, 2);
      if (o.ends) o.ends.push([bx + lean*0.3, y1 - 2, 1], [bx - lean*0.4, y0 + 0.4, 1]);
      slantBars(fb, bx, y0 + 1.2, y1 - 1.2, lean, wa, wb, big ? 1.8 : 1.1, big ? 6.4 : 3.6);
      if (big) sprig(fb, bx + 0.4, y0 + 8, 17, i % 2 ? 'sage' : 'buff', BARW[(bi + 1) % 5]);
      if (i === nC) break;
      const face = i % 2 === 0 ? -sd : sd, pi = Math.floor(i/2) + pairI;
      const a = lot.lead[pi % 5], b = lot.lead[(pi + 2) % 5];
      const fn = cast[Math.floor(i/2) % 2];
      const tb = bfb && o.keepFirst && i === 0 ? fb : bfb;
      const xB = zs + sd*(i + 0.5)*cw;
      if (o.ends) o.ends.push([xB - 5*s, y0 + (big ? 2.2 : 1.3) + 11*s, 1], [xB + 6*s, y0 + (big ? 2.2 : 1.3) + 7*s, 1]);
      // o.skip(x): no beast stands there (the wools are drawn all the same); a second pair of bars and two sprigs take its place
      const sk = !!(o.skip && o.skip(xB));
      if (sk) { slantBars(fb, xB, y0 + 1.2, y1 - 1.2, -lean, BARW[(bi + 2) % 7], BARW[(bi + 5) % 7], 1.8, 6.4); sprig(fb, xB - 10.8, y0 + 8, 17, 'buff', BARW[(bi + 3) % 5]); sprig(fb, xB + 11.6, y0 + 8, 17, 'sage', BARW[(bi + 4) % 5]); }
      if (tb) fn(sk ? VOID_FB : tb, zs + sd*(i + 0.5)*cw - face*2.6*s, y0 + (big ? 2.2 : 1.3), s*rng.range(0.94, 1), face, i % 2 === 0 ? { a, b } : { a: b, b: a }, rng.range(0, 6.28));
      if (!big && i % 2 === 1 && i < nC - 1) sprig(fb, zs + sd*(i + 1)*cw + sd*3.3, y0 + 1.6, 6.5, 'sage', BARW[(bi + 2) % 5]);
      if (i % 3 === 2) await S.ctx.yield();
    }
    pairI += 3;
    await S.ctx.yield();
  }
  for (const b of [fb, bfb]) if (b) { b.kindFn = null; b.line2 = null; b.kind = 0; }
  fb.at(); fb.kind = 0;
}
// a strip of linen behind a border (standing strips ride the billow; hung ones sway on their rail)
function clothStrip(x0, x1, y0, y1, z, rows = 1) {
  const cols = Math.max(2, Math.round((x1 - x0)/8)), pos = [], idx = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) pos.push(x0 + (x1 - x0)*i/cols, y0 + (y1 - y0)*j/rows, z);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j*(cols + 1) + i, b = a + cols + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

async function buildBorders(S) {
  const { style, atZ, rare, facing, addFlat, ctx, uS, uH, gazeDeg } = S;
  const DIVE_EL = 17.5;   // the running span's lower rope stands this many degrees above the middle of the frame
  const grp = facing('borders'), movers = [];
  const linenStand = style.linen({ plane: 'xy', ride: 1 }), linenStill = style.linen({ plane: 'xy' }), woolStill = style.wool({ ride: 0 });
  // lower border: four standing bands with a gap for the rail
  const LOW = [[40, 0], [470, 0], [978, 0], [1400, 0], [1170, 0]];
  // from z 1,100 every border is worked in full wool like the rest, and the hand has left its wool hanging: LATE is how
  // many loose ends hang from each of the last borders (a share of its bars and beasts), more with every border
  const LATE = { 1170: 0.5, 1235: 0.75, 1400: 0.6, 1420: 0.7 };
  const LW = ['terracotta', 'gold', 'bluegreen'], hh = (i, k) => { const q = Math.sin(i*127.1 + k*311.7)*43758.5453; return q - Math.floor(q); };
  // loose ends: wool left hanging where the hand stopped; from a hung span they hang long, some to within reach of the eye
  const looseEnds = (ends, z, gx, hung, name, mat) => {
    const th = [];
    ends.forEach(([x, y, st], i) => {
      if (hh(i, z) > LATE[z]*S.detail || (!hung && y < 4)) return;
      th.push({ x, y, z: 0.5, len: hung ? 7 + 15*hh(i, 3) : Math.min(y - 0.6, 3 + 6*hh(i, 3)), wool: LW[(i + Math.floor(3*hh(i, 5))) % 3], lean: -0.04 + 0.06*hh(i, 7), phase: hh(i, 9), width: 0.3 + 0.2*hh(i, 11) });
    });
    if (hung && z < 1300) for (let i = 0; i < Math.round(15*S.detail); i++) {   // and a comb of long ones over the rail itself
      const x = gx + (i % 2 ? 1 : -1)*(4 + 62*hh(i, 21)*hh(i, 23) + i*0.9);
      th.push({ x, y: hung[0] - 37.4, z: 0.5, len: 9 + 12*hh(i, 25), wool: LW[i % 3], lean: -0.03 + 0.04*hh(i, 27), phase: hh(i, 29), width: 0.34 + 0.2*hh(i, 31) });
    }
    const m = new THREE.Mesh(makeFringe(th, hung ? 12 : 7), mat); m.name = name; m.frustumCulled = false; m.position.z = -z; grp.add(m);
  };
  for (let k = 0; k < 5; k++) {
    const [z, kind] = LOW[k], gx = -atZ(z).x, fb = new FlatBuilder();
    const bf = rare && k > 0 ? new FlatBuilder() : undefined;
    const last = k === 3, wd = k === 0 ? 300 : 245, gw = k === 0 ? 13 : 15.5, o = { xa: gx - wd, xb: gx + wd, gap: last ? null : [gx - gw, gx + gw], y0: 0.6, h: 13.4, zb: -z, kind, beasts: bf, keepFirst: true, ends: LATE[z] === undefined ? null : [] };
    setSmooth(k === 0 ? 1 : 0.6); await bandWork(S, fb, o); setSmooth(1);
    if (last) { fb.at(gx, 14, ARCH_K, 1); archWork(S, fb, 0, 0, -z); }
    await ctx.yield();
    const lm = last ? linenStill : linenStand;
    const c1 = new THREE.Mesh(clothStrip(o.xa - 4, gx - (last ? 0 : gw - 0.6), -1.5, 14.9, -z - 0.06), lm), c2 = new THREE.Mesh(clothStrip(gx + (last ? 0 : gw - 0.6), o.xb + 4, -1.5, 14.9, -z - 0.06), lm);
    c1.frustumCulled = c2.frustumCulled = false; grp.add(c1, c2);
    addFlat(grp, fb, last ? woolStill : null, 'lower-border-' + k);
    await ctx.yield();
    if (o.ends) { for (const e of o.ends) e[1] = Math.min(e[1], 11); looseEnds(o.ends, z, gx, null, 'loose-ends-low-' + k, style.thread({ ride: last ? 0 : 1 })); }
    if (bf) movers.push({ mesh: addFlat(grp, bf, null, 'lower-beasts-' + k), z, drop: 0, k });
    await ctx.yield();
  }
  // upper border: the hero's span is carried on to both sides, then two more hung spans
  // (the fourth span hangs low over the rail and is passed under: for 82 m either side of the rail it carries slanted bars
  // and sprigs only, which leave the top of the frame as stripes; no beast stands where it would be cut off at the legs)
  const UP = [[330, 70, 0, 1], [1000, 56, 0, 0], [1420, 70, 0, 0], [1235, 42, 0, 0]];
  // the second span runs on its rail: it goes ahead of us down the dive (a transform only) and hangs still at z 1000
  const dive = new THREE.Group(); dive.name = 'dive-span'; grp.add(dive);
  for (let k = 0; k < 4; k++) {
    const [z, y0, kind, ext] = UP[k], gx = -atZ(Math.min(z, 1400)).x, hung = [y0 + 38, 38];
    const fb = new FlatBuilder(), bf = rare && k > 0 ? new FlatBuilder() : undefined, ends = [];
    const woolHung = style.wool({ hung }), linenHung = style.linen({ plane: 'xy', hung });
    if (ext) {
      setSmooth(0.75); await bandWork(S, fb, { xa: -560, xb: -263, gap: null, y0, h: 36, zb: 0 }); await bandWork(S, fb, { xa: 263, xb: 560, gap: null, y0, h: 36, zb: 0 }); setSmooth(1);
      for (const [a, b] of [[-564, -260], [260, 564]]) { const c = new THREE.Mesh(clothStrip(a, b, y0 - 2, y0 + 38, -0.03, 4), linenHung); c.frustumCulled = false; c.position.z = -z; grp.add(c); }
    } else {
      setSmooth(0.75); await bandWork(S, fb, { xa: gx - 345, xb: gx + 345, gap: null, y0, h: 36, zb: 0, kind, beasts: bf, ends: LATE[z] === undefined ? null : ends, skip: k === 3 ? (x) => Math.abs(x - gx) < 82 : null }); setSmooth(1);
      await ctx.yield();
      if (LATE[z] !== undefined) looseEnds(ends, z, gx, hung, 'loose-ends-up-' + k, style.thread({ hung }));
      const c = new THREE.Mesh(clothStrip(gx - 349, gx + 349, y0 - 2, y0 + 38, -0.03, 4), linenHung); c.frustumCulled = false; c.position.z = -z; (k === 1 ? dive : grp).add(c);
    }
    await ctx.yield();
    const m = addFlat(k === 1 ? dive : grp, fb, woolHung, 'upper-border-' + k); m.position.z = -z;
    if (bf) { const bm = addFlat(k === 1 ? dive : grp, bf, woolHung, 'upper-beasts-' + k); bm.position.z = -z; movers.push({ mesh: bm, z, drop: y0 + 2, k: k + 4, dive: k === 1 }); }
    await ctx.yield();
  }
  return {
    update(dt, time, camera, u, camPos) {
      // the running span. Before the star it hangs high behind the star's own span, out of sight from anywhere on the rail;
      // as we come through the fringe it is let down from behind that span into the top of the frame 260 m ahead, keeps ahead of us down the
      // dive (closing to 174 m) and stops at z 1000 with its lower rope 56 m up, where the hull pass finds it
      {
        const d = 172, zD = Math.min(1000, Math.max(505, camPos.z + d)), far = zD - camPos.z;
        const want = Math.max(56, camPos.y + far*Math.tan((DIVE_EL + gazeDeg(u))*Math.PI/180));
        const lowY = want + (56 - want)*sstep(900, 1000, zD);
        const hide = camPos.z < 329 && u < uS ? Math.min(215, camPos.y + far*(72 - camPos.y)/Math.max(330 - camPos.z, 1) + 3) : 215;
        const y = hide + (lowY - hide)*sstep(uS - 0.012, uS + 0.008, u);
        dive.position.set(0, y - 56, 1000 - zD);
      }
      // the rare event: at u 0.31 every beast leaves its bars and goes down to the main register, pacing to starboard
      for (const m of movers) {
        const t = sstep(uS + 0.01 + m.k*0.004, uS + 0.11 + m.k*0.004, u);
        // (the running span's beasts leave it wherever it is and come down at z 1070 like the rest)
        m.mesh.position.y = -(m.drop + (m.dive ? dive.position.y : 0))*t;
        m.mesh.position.z = (m.drop > 0 ? -m.z - 70*t - (m.dive ? dive.position.z*t : 0) : 34*t);       // local +z is back toward the viewer
        m.mesh.position.x = t*(30 + 46*(u - uS));
      }
    },
  };
}

// ---- motifs of the main register ------------------------------------------------------------------------------
// a line that curls tighter toward its end (a bough, a stern post): heading = a0 + turn*(s/len)^2
function curl(x, y, a0, len, turn, n = 22, pw = 2) {
  const p = [[x, y]], ds = len/n;
  for (let i = 1; i <= n; i++) { const a = a0 + turn*Math.pow((i - 0.5)/n, pw); x += Math.cos(a)*ds; y += Math.sin(a)*ds; p.push([x, y]); }
  return p;
}
// a leaf knot: three (or four) round lobes
const lobed = (cx, cy, r, rot, lobes = 3) => { const p = [], sweep = lobes === 3 ? 2.0 : 1.75;
  for (let k = 0; k < lobes; k++) { const a = rot + k*Math.PI*2/lobes, ox = cx + Math.cos(a)*r*0.5, oy = cy + Math.sin(a)*r*0.5;
    for (let j = -3; j <= 3; j++) { const b = a + j*sweep/3; p.push([ox + Math.cos(b)*r*0.56, oy + Math.sin(b)*r*0.56]); } }
  return p; };
const outl = (w, i) => (w === 'terracotta' || (i % 2 === 0 && w !== 'blue')) ? 'dark' : (w === 'dark' ? 'gold' : 'terracotta');
// the hanging's only plant: three strands that part, interlace twice and end in curled boughs closed by leaf knots
function knotTree(fb, x, H, wools, rng, o = {}) {
  fb.at(x, o.y || 0, 1, o.dir || 1);
  if (o.half) fb.line2 = 'dark';                                // o.half: the starboard boughs and strand are only drawn
  H *= 1.15;
  const hT = H*0.46, ph = rng.range(0, 6.28), kind = o.kind || 0;
  const strands = [];
  for (let i = 0; i < 3; i++) {
    const cl = []; for (let j = 0; j <= 16; j++) { const y = hT*j/16; cl.push([(i - 1)*1.1*(1 - j/16) + 2.3*Math.sin(Math.PI*2*y/hT + i*2.094 + ph)*Math.min(1, y/3.5), y]); }
    strands.push(cl);
  }
  let wi = rng.int(0, 3);
  const bough = (x0, y0, a0, len, turn, w0, hingeAmp, un) => {
    const w = wools[wi % wools.length], lw = outl(w, wi), cl = curl(x0, y0, a0, len, turn, 20), e = cl[cl.length - 1], kw = wools[(wi + 2) % wools.length]; wi++;
    fb.hinge(x0, y0, hingeAmp, 0.5 + 0.2*(wi % 3), ph + wi);
    fb.shape(band(cl, w0, w0*0.55), w, lw, a0 + turn*0.3, { inset: 0.22, kind: un ? 2 : kind, width: un ? 0.62 : 0.3 });
    fb.shape(lobed(e[0], e[1], H*0.075, wi*1.3), kw, outl(kw, wi + 1), wi*0.9, { inset: 0.2, kind: un ? 2 : kind, width: un ? 0.62 : 0.3 });
    if (un && o.ends) o.ends.push([x + (o.dir || 1)*e[0], (o.y || 0) + e[1] - H*0.05], [x + (o.dir || 1)*cl[12][0], (o.y || 0) + cl[12][1]]);
    fb.noHinge();
    return cl;
  };
  // far boughs first (they lie under the trunk), then the strands, then the near boughs
  const tops = strands.map((c) => c[c.length - 1]);
  for (let i = 0; i < 3; i++) {
    const sd = i === 1 ? (rng.chance(0.5) ? 1 : -1) : i - 1;
    const c = bough(tops[i][0], tops[i][1] - 0.5, Math.PI/2 - sd*0.55 - (o.over || 0), H*rng.range(0.5, 0.62)*(i === 1 ? 1.12 : 1), -sd*rng.range(3.0, 3.8)*(o.over && sd*o.over > 0 ? 0.3 : 1), 1.7, 0.035, o.half && sd > 0);
    const q = c[7];
    bough(q[0], q[1], Math.PI/2 + sd*0.9, H*rng.range(0.3, 0.4), sd*rng.range(3.4, 4.2), 1.25, 0.05, o.half && sd > 0);
  }
  for (let i = 0; i < 3; i++) { const w = wools[(wi + i) % wools.length]; fb.shape(band(strands[i], 1.7, 1.5), w, outl(w, i), Math.PI/2, { inset: 0.22, kind: o.half && i === 2 ? 2 : kind }); }
  // a root knot where the strands start
  fb.shape(lobed(0, 0.9, 2.6, Math.PI/2), wools[(wi + 3) % wools.length], 'dark', 0, { inset: 0.2, kind });
  fb.line2 = null;
  return fb.noHinge().at();
}
// neck and head of a horse, hinged at the base of the neck (also what looks over a ship's rail)
function horseHead(fb, A, B, ln, lb, phase, amp = 0.05) {
  fb.hinge(9, 20, amp, 1.1, phase);
  fb.shape(smoothLoop([[11.2, 31.6], [10.6, 34.8], [12.8, 33.0]], 3), B, lb, 1.4, { inset: 0.12 });                        // far ear, other wool
  fb.shape(band(smoothLoop([[7.6, 18.4], [10.6, 23.6], [13.2, 29.4]], 5, false), 7.4, 4.0), A, ln, 1.15, { inset: 0.22 });
  fb.shape(smoothLoop([[11.4, 31.2], [14.4, 32.2], [17.6, 30.0], [20.8, 26.6], [20.6, 24.7], [18.4, 24.3], [15.4, 26.0], [12.2, 27.4]], 4), A, ln, -0.75, { inset: 0.22 });
  fb.shape(smoothLoop([[12.6, 31.8], [12.8, 35.4], [14.6, 32.6]], 3), A, ln, 1.4, { inset: 0.12 });                        // near ear
  for (let i = 0; i < 5; i++) { const mx = 6.6 + i*1.25, my = 21.6 + i*2.3; fb.rope(smoothLoop([[mx + 1.5, my + 1.2], [mx, my + 0.6], [mx - 1.0, my - 0.9], [mx - 0.2, my - 2.0]], 3, false), B, 0.42); }
  fb.disc(15.6, 29.3, 0.55, 'linen', ln, 0, 8, { inset: 0 });
  fb.rope([[19.6, 25.0], [20.5, 25.6]], ln, 0.24);
  fb.rope(smoothLoop([[17.2, 30.2], [16.6, 27.6], [17.8, 25.0]], 3, false), B, 0.36);                                       // a bridle strap
  return fb.noHinge();
}
// a horse 20 m at the shoulder, facing +x, feet at y 0; its far legs and far ear are in another wool
function horse(fb, x, s, dir, A, B, phase) {
  const ln = lineFor(A) === B ? 'dark' : lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(x, 0, s, dir);
  const leg = (hx, hy, w, l, ph, fore) => {
    fb.hinge(hx, hy, 0.24, 1.9, ph);
    const cl = fore ? [[hx, hy + 1], [hx + 0.5, hy - 5.6], [hx - 0.1, hy - 10.6], [hx + 0.5, hy - 12.6]] : [[hx, hy + 1], [hx - 1.5, hy - 5.2], [hx + 0.4, hy - 10.4], [hx + 0.7, hy - 12.6]];
    fb.shape(band(smoothLoop(cl, 4, false), 3.4, 1.5), w, l, Math.PI/2, { inset: 0.22 });
    const e = cl[3]; fb.shape([[e[0] - 1.0, e[1] + 0.2], [e[0] + 1.1, e[1] + 0.2], [e[0] + 1.8, e[1] - 1.5], [e[0] - 1.2, e[1] - 1.5]], 'dark', l === 'dark' ? 'terracotta' : l, 0, { inset: 0.1, width: 0.2 });
    fb.noHinge();
  };
  leg(8.4, 14.2, B, lb, phase + Math.PI, true); leg(-6.6, 14.4, B, lb, phase, false);
  fb.hinge(-10.6, 19.4, 0.09, 0.9, phase);
  fb.shape(band(smoothLoop([[-10.4, 19.6], [-13.4, 18.6], [-15.2, 14.4], [-14.8, 9.0], [-15.8, 5.6]], 5, false), 2.6, 0.7), B, lb, 1.3, { inset: 0.2 });
  fb.noHinge();
  fb.shape(smoothLoop([[-11, 18.6], [-9.2, 21.6], [-3, 21.0], [3, 21.2], [7.6, 22.6], [10.4, 20.4], [10.8, 15.6], [8.2, 12.6], [2, 11.4], [-4, 12], [-9, 12.4], [-11.6, 15.2]], 4), A, ln, 0.03);
  fb.rope(smoothLoop([[-2.4, 20.8], [-1.6, 16.6], [-2.6, 12.2]], 3, false), B, 0.5); fb.rope(smoothLoop([[1.2, 21.0], [2.0, 16.6], [1.0, 11.8]], 3, false), B, 0.5);   // girths
  leg(6.6, 13.8, A, ln, phase, true); leg(-8.6, 14.0, A, ln, phase + Math.PI, false);
  horseHead(fb, A, B, ln, lb, phase);
  return fb.at();
}

// ---- the shore: fourteen knot trees and three horses in impossible wools --------------------------------------------
async function buildShore(S) {
  const { rng, lot, facing, addFlat, ctx } = S;
  const grp = facing('shore'), fb = new FlatBuilder();
  const TW = lot.lead.slice(0, 4);
  // two flank the rail, their inner boughs crossing overhead
  fb.zb = -64; knotTree(fb, -27, 41, TW, rng, { over: -0.2 });
  await ctx.yield();
  fb.zb = -66; knotTree(fb, 27, 40, TW, rng, { over: 0.2 });
  await ctx.yield();
  const SPOTS = [[64, -62, 27], [74, 74, 30], [94, 152, 26], [116, -142, 31], [142, 66, 33], [152, -208, 28], [198, 120, 30], [216, -76, 27], [238, 196, 32], [258, -156, 29], [300, 140, 56], [304, -140, 58]];   // (the two great ones stand clear of the climb's field of view)
  for (let i = 0; i < SPOTS.length; i++) {
    const [z, x, H] = SPOTS[i];
    fb.zb = -z; knotTree(fb, x + rng.range(-6, 6), H + rng.range(-1.5, 2.5), TW, rng, { dir: rng.chance(0.5) ? 1 : -1 });
    if (i % 2 === 1) await ctx.yield();
  }
  addFlat(grp, fb, null, 'knot-trees');
  await ctx.yield();
  // horses: each its own flat so it can walk
  const HS = [[168, -33, 0.95, lot.horse[0], lot.horse[1], 12], [238, 37, 0.9, lot.horse2[0], lot.horse2[1], 9], [288, -128, 1.0, lot.lead[2], lot.lead[4], 14], [152, 44, 0.88, lot.lead[2], lot.lead[1], 10]];
  const horses = HS.map(([z, x, s, A, B, walk], i) => {
    const hb = new FlatBuilder(); horse(hb, 0, s, 1, A, B, i*1.7);
    const m = addFlat(grp, hb, null, 'horse-' + i); m.position.set(x - walk, 0, -z);
    return { m, x, walk };
  });
  await ctx.yield();
  return {
    update(dt, time, camera, u) {
      // they walk down the shore as we come (keyed to u, so the blue horse is beside the rail when we pass it)
      for (let i = 0; i < horses.length; i++) { const h = horses[i]; h.m.position.x = h.x - h.walk*(1 - sstep(0, 0.14 + i*0.05, u)) + 0.5*Math.sin(time*0.35 + i); }
    },
  };
}

// ---- a clinker ship in profile, bow to +x (starboard): 70 m of hull, 9 m of freeboard, a 44 m mast -----------------
// W: { strakes: [5 wools], sail: [3 or 6 wools, one for each stripe in turn], post, shield: [2 wools] };
// o: { kind (2: only drawn, in the dark line, pricked where the wool was to go), men, heads, phase, halfSail (the port
// three stripes of the sail are worked), half (worked from the stern as far as the mast, the two lowest strakes right along) }
function ship(fb, x, s, W, o = {}) {
  const kind = o.kind || 0, ph = o.phase || 0, SW = W.sail, nW = SW.length;
  const kx = (xl) => o.half ? (xl < 2 ? 0 : 2) : kind;          // how far the work has come at xl along the hull
  const nWk = o.half ? 4 : 3;                                    // stripes of a half-filled sail that are worked, from the port side
  const kind0 = fb.kind, line0 = fb.line2; fb.kind = kind; if (kind === 2 || o.half || o.halfSail) fb.line2 = 'dark';
  fb.at(x, 0, s, 1);
  const top = (t) => 9.2 + 6.4*Math.abs(t*t*t), bot = (t) => 0.7 + 11.2*Math.abs(t*t*t);
  const edge = (i) => { const p = []; for (let j = 0; j <= 20; j++) { const t = -1 + j/10; p.push([35*t, bot(t) + (top(t) - bot(t))*i/5]); } return p; };
  const reAt = (ax, ay, as) => { const z = fb.z; fb.at(ax, ay, as, 1); fb.z = z; };   // at() without restarting the layers
  // stays, mast and yard behind everything
  if (!o.bare) {
  // (o.noStays: the flagship is passed so close that a stay would be a dark line ruled across the ships beyond her)
  if (!o.noStays) { fb.cls = 1; fb.rope([[0, 53], [31, 15.5]], 'dark', 0.34); fb.rope([[0, 53], [-31, 15.5]], 'dark', 0.34); fb.cls = 0; }
  fb.rope([[0, 9], [0.3, 30], [0, 54.5]], W.post, 0.9);
  // the sail: square, gathered to a point at the foot, striped down its length; it bellies on its yard
  fb.hinge(0, 51, 0.022, 0.55, ph);
  // the sail's own outline is a wool, not the dark line: blue-green round the warm sails, terracotta round the cool ones
  const sailEdge = W.sail[0] === 'terracotta' || W.sail[0] === 'gold' ? 'bluegreen' : 'terracotta';
  const foot = [1.5, 14.2], nS = 6, curve = (k) => { const p = []; for (let j = 0; j <= 10; j++) { const v = j/10, xk = -18 + 36*k/nS;
    p.push([xk + (foot[0] - xk)*Math.pow(v, 1.7) + (k/nS - 0.5)*9*Math.sin(Math.PI*v), 50.6 + (foot[1] - 50.6)*v + (v < 0.05 ? 0 : 0)]); } return p; };
  for (let k = 0; k < nS; k++) {
    const a = curve(k), b = curve(k + 1).reverse(); b.shift();
    const w = SW[k % nW], kk = o.halfSail || o.half ? (k < nWk ? 0 : 2) : kind;
    fb.fill(a.concat(b), w, Math.PI/2, { inset: 0.16, kind: kk });
  }
  for (let k = 0; k <= nS; k++) { const edge_ = k === 0 || k === nS, drawn = kind === 2 || ((o.half || o.halfSail) && k > nWk);
    fb.cls = edge_ || drawn ? 0 : 1;                               // (a drawn stripe's line is all there is of it: it never thins away)
    fb.rope(curve(k), drawn ? (edge_ ? 'dark' : SW[k % nW]) : edge_ ? sailEdge : lineFor(SW[k % nW]) === SW[(k + nW - 1) % nW] ? 'dark' : lineFor(SW[k % nW]), edge_ ? (drawn ? 0.62 : 0.42) : drawn ? 0.5 : 0.3); }
  fb.cls = 0;
  fb.rope([[-19.5, 50.8], [19.5, 50.8]], W.post === 'gold' ? 'terracotta' : 'gold', 0.8);
  fb.noHinge();
  fb.cls = 1; fb.rope([foot, [-13, 12.5]], 'dark', 0.3); fb.rope([foot, [15, 12.5]], 'dark', 0.3); fb.cls = 0;
  }
  // posts: a beast's head at the prow, a curled stern
  const prow = curl(34.2, 12.6, 1.2, 14.5, 0.55, 10), pe = prow[prow.length - 1];
  const kP = kx(35);
  fb.shape(band(prow, 3.8, 2.3), W.post, lineFor(W.post), 1.3, { inset: 0.22, kind: kP });
  const hd = [[-1.6, -1.0], [-2.0, 2.8], [0.2, 4.6], [3.4, 4.0], [7.2, 2.4], [7.0, 1.2], [4.0, 1.0], [6.8, -0.9], [6.0, -1.9], [2.2, -1.6]].map((p) => [pe[0] + p[0], pe[1] + p[1]]);
  fb.shape(smoothLoop(hd, 3), W.strakes[0], lineFor(W.strakes[0]), 0.2, { inset: 0.2, kind: kP });
  fb.shape(smoothLoop([[pe[0] - 1.2, pe[1] + 3.6], [pe[0] - 2.6, pe[1] + 6.6], [pe[0] + 0.6, pe[1] + 4.6]], 3), W.shield[1], 'dark', 1.2, { inset: 0.12, kind: kP });
  fb.disc(pe[0] + 2.0, pe[1] + 2.5, 0.6, 'linen', 'dark', 0, 8, { inset: 0, kind: 2 });
  fb.shape(band(curl(-34.2, 12.6, Math.PI - 1.2, 25, -5.2, 26, 1.6), 3.8, 1.3), W.post, lineFor(W.post), 1.3, { inset: 0.2, kind: kx(-35) });
  // who looks over the rail: horses' heads that nod, and far off rows of bare linen ovals
  const nH = o.heads || 3, hx = [];
  for (let i = 0; i < nH; i++) {
    const xh = -15 + i*(nH > 3 ? 8.5 : 11.5) + (i % 2)*1.5; hx.push(xh);
    const A = W.strakes[(i + 2) % 5], B = W.strakes[(i + 4) % 5], hs = 0.44;
    fb.kind = kx(xh + 4);
    reAt(x + (xh - 9*hs)*s, (8.6 - 19.5*hs)*s, hs*s); fb.cls = 1; horseHead(fb, A, B, lineFor(A) === B ? 'dark' : lineFor(A), 'dark', ph + i*2.1, 0.11); fb.cls = 0; reAt(x, 0, s);
  }
  fb.kind = kind;
  fb.cls = 2;
  if (o.men) for (let i = 0; i < 12; i++) {
    const xm = -20.5 + i*3.7; if (hx.some((h) => xm > h - 2.5 && xm < h + 7)) continue;
    const pts = []; for (let j = 0; j < 10; j++) { const a = j/10*Math.PI*2; pts.push([xm + Math.cos(a)*1.25, top(xm/35) + 1.5 + Math.sin(a)*1.6]); }
    fb.shape(pts, 'linen', 'dark', 0, { inset: 0, kind: 2, width: 0.26 });
  }
  fb.cls = 0;
  // five strakes, each its own wool, laid along the plank; then the lands between them
  const E = [0, 1, 2, 3, 4, 5].map(edge);
  for (let i = 0; i < 5; i++) fb.fill(E[i].concat(E[i + 1].slice().reverse()), W.strakes[i], 0, { inset: 0.14, kind: o.half ? (i < 3 ? 0 : 2) : kind });
  for (let i = 0; i <= 5; i++) { const dr = kind === 2 || (o.half && i > 3); fb.cls = i === 5 || i === 0 || dr ? 0 : 1; fb.rope(E[i], i === 5 || i === 0 ? 'dark' : dr ? W.strakes[Math.min(i, 4)] : (W.strakes[i] === 'terracotta' || W.strakes[i - 1] === 'terracotta' ? 'dark' : i % 2 ? 'dark' : 'terracotta'), i === 5 || i === 0 ? (kind === 2 ? 0.62 : 0.5) : dr ? 0.5 : 0.3); }
  fb.cls = 1;
  // round shields at bow and stern in alternating wools
  for (let i = 0; i < 10; i++) {
    const t = (i < 5 ? -0.93 + i*0.105 : 0.51 + (i - 5)*0.105), w = W.shield[i % 2];
    const l2 = fb.line2; fb.line2 = null;                           // (a drawn shield is a ring of the wool that was to fill it)
    fb.disc(35*t, top(t) + 0.5, 1.95, w, lineFor(w), i*0.7, o.seg || 14, { inset: 0.22, kind: kx(35*t), width: kx(35*t) === 2 ? 0.5 : 0.3 }); fb.line2 = l2;
    fb.disc(35*t, top(t) + 0.5, 0.5, W.shield[(i + 1) % 2], null, 0, 10, { inset: 0, kind: kx(35*t) });
  }
  fb.cls = 0;
  // the steering oar at the quarter, laid over the strakes so it is one thing from tiller to blade
  fb.hinge(-27.5, 12.5, 0.1, 0.8, ph);
  fb.rope([[-26.6, 15.5], [-29.6, 3.2]], W.post, 0.9);
  fb.shape([[-29.0, 4.6], [-31.6, 4.2], [-32.6, -1.4], [-30.6, -1.8]], W.strakes[2], 'dark', 1.3, { inset: 0.15, kind: kx(-30) });
  fb.noHinge();
  fb.kind = kind0; fb.line2 = line0;
  return fb.noHinge().at();
}

// the flagship: the same ship built SF times its drawing, all five lead wools in her strakes, three wools in her sail,
// a square banner with three tails at the masthead (no device on it) and a lobed knot over it
function flagship(fb, lot, ph) {
  const L = lot.lead, W = { strakes: [L[1], L[2], L[4], L[3], L[0]], sail: lot.sail, post: L[0], shield: [L[2], L[4]] };
  setSmooth(1.0); ship(fb, 0, SF, W, { seg: 20, men: true, heads: 4, phase: ph, noStays: true }); setSmooth(1);
  fb.at(0, 0, SF, 1);
  fb.rope([[0, 54], [0.1, 61.5]], W.post, 0.8);
  fb.hinge(0.4, 58, 0.05, 1.3, ph);
  const tails = [L[1], L[0], L[2]];
  for (let i = 0; i < 3; i++) {
    const y = 59.6 - i*1.45, cl = []; for (let j = 0; j <= 8; j++) cl.push([5.6 + j*1.0, y - 0.1*j + 0.45*Math.sin(j*0.9 + i)]);
    fb.shape(band(cl, 1.25, 0.5), tails[i], lineFor(tails[i]), 0, { inset: 0.16, width: 0.26 });
  }
  fb.shape([[0.5, 55.6], [5.8, 55.9], [5.8, 60.5], [0.5, 60.2]], 'gold', 'terracotta', 0, { inset: 0.2 });
  fb.shape([[1.7, 56.8], [4.6, 57.0], [4.6, 59.4], [1.7, 59.2]], L[4] === 'gold' ? 'bluegreen' : L[4], 'dark', Math.PI/2, { inset: 0.14, width: 0.26 });
  fb.noHinge();
  fb.shape(lobed(0.1, 62.6, 1.5, Math.PI/2, 4), 'gold', 'terracotta', 0, { inset: 0.15 });
  // her prow beast is worked further than any other: collars round the neck, a curl on the jowl, teeth and a tongue
  fb.at(0, 0, SF, 1); fb.z = 2.6;
  const prow = curl(34.2, 12.6, 1.2, 14.5, 0.55, 10), pe = prow[10];
  for (let i = 1; i <= 8; i++) {
    const a = prow[i - 1], b = prow[i + 1], q = prow[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1])/l, ny = (b[0] - a[0])/l, hw = (3.8 - 1.5*i/10)*0.5 - 0.35;
    fb.rope([[q[0] - nx*hw, q[1] - ny*hw], [q[0] + nx*hw*0.2, q[1] + ny*hw*0.2 + 0.25], [q[0] + nx*hw, q[1] + ny*hw]], i % 2 ? 'gold' : L[4] === 'gold' ? 'bluegreen' : L[4], 0.5);
  }
  fb.rope(curl(pe[0] + 0.2, pe[1] + 0.2, -0.4, 5.2, 5.4, 14), 'gold', 0.42);
  fb.shape(band(curl(pe[0] + 4.3, pe[1] + 0.75, -0.25, 6.2, 2.6, 10), 0.95, 0.4), L[0], 'dark', 0, { inset: 0.14, width: 0.24 });
  for (let i = 0; i < 3; i++) { const x = pe[0] + 4.5 + i*0.85, y = pe[1] + 1.05 + i*0.06; fb.shape([[x, y], [x + 0.62, y + 0.04], [x + 0.3, y - 0.62]], 'linen', 'dark', 0, { inset: 0, kind: 2, width: 0.2 }); }
  return fb.at();
}

// a fish of the border, let into the sea: 9 m long, facing +x, its tail and fins in another wool
function fishFlat(fb, A, B) {
  const ln = lineFor(A) === B ? 'dark' : lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(0, 0, 1, 1);
  fb.hinge(-3.0, 0, 0.3, 5.0, 0.7);
  fb.shape([[-2.8, 0.35], [-5.4, 2.1], [-4.7, 0], [-5.4, -2.1], [-2.8, -0.35]], B, lb, 0.5, { inset: 0.14, width: 0.26 });
  fb.noHinge();
  fb.shape(smoothLoop([[-0.9, 1.2], [0.5, 2.9], [2.0, 1.3]], 3), B, lb, 1.2, { inset: 0.12, width: 0.24 });
  fb.shape(smoothLoop([[-0.2, -1.2], [0.2, -2.5], [1.5, -1.2]], 3), B, lb, 1.2, { inset: 0.12, width: 0.24 });
  fb.shape(smoothLoop([[-3.3, 0], [-1.6, 1.25], [1.4, 1.55], [3.6, 0.8], [4.6, 0], [3.5, -0.85], [1.0, -1.45], [-1.7, -1.1]], 4), A, ln, 0.05, { inset: 0.16, width: 0.3 });
  fb.rope(smoothLoop([[2.5, 1.1], [2.0, 0], [2.5, -1.0]], 3, false), B, 0.3);
  fb.rope(smoothLoop([[0.6, 1.2], [0.1, 0], [0.5, -1.2]], 3, false), B, 0.26); fb.rope(smoothLoop([[-1.0, 1.0], [-1.5, 0], [-1.1, -0.9]], 3, false), B, 0.26);
  fb.disc(3.3, 0.3, 0.28, 'linen', ln, 0, 6, { inset: 0, width: 0.16 });
  return fb.noHinge().at();
}

// free wool left on a worked ship: long loose ends from both yard-arms (they hang beside the sail, on bare linen), and a
// few from the prow beast's jaw and the stern post; terracotta, gold and blue-green, in turn
const hEnd = (i, k) => { const q = Math.sin(i*127.1 + k*311.7)*43758.5453; return q - Math.floor(q); };
function shipEnds(th, x0, s, id, detail) {
  const LW = ['terracotta', 'gold', 'bluegreen'], n = Math.round(14*detail);
  for (let i = 0; i < n; i++) {
    const c = i % 7, f = hEnd(id, i), g = hEnd(id, i + 40), sd = i % 2 ? 1 : -1;
    const x = c < 5 ? sd*(18.4 + 2.8*f) : c === 5 ? 39 + 5*f : -41 + 6*f, y = c < 5 ? 50.6 : c === 5 ? 24 + 3*g : 17 + 8*g, len = c < 5 ? 14 + 20*g : 7 + 8*g;
    th.push({ x: x0 + x*s, y: y*s, z: 0.9, len: Math.min(len, y*s - 2), wool: LW[(i + id) % 3], lean: sd*0.02 + 0.03*(hEnd(id, i + 80) - 0.5), phase: hEnd(id, i + 90), width: 0.55 + 0.3*hEnd(id, i + 95) });
  }
}

// ---- the fleet: six ranks, each one wool on from the rank before, sliding to starboard; and the drawn water --------
async function buildFleet(S) {
  const { rng, lot, facing, atZ, style, speedK, ctx, scene } = S;
  const ALL = lot.lead.concat(['buff']);
  // each rank has its own wool: two sail stripes in three and the sheer strake are in it, the third stripe is its accent
  const RANKW = { terracotta: ['terracotta', 'bluegreen', 'gold', 'olive', 'blue'], blue: ['bluegreen', 'terracotta', 'gold', 'blue', 'olive'], green: ['terracotta', 'olive', 'gold', 'sage', 'bluegreen'] }[S.lotName];
  // (every sail is striped in three wools: its rank's own wool leads, in every other stripe, and two more take turns between)
  const ACC = { terracotta: ['gold', 'bluegreen'], bluegreen: ['gold', 'terracotta'], gold: ['terracotta', 'bluegreen'], olive: ['gold', 'terracotta'], blue: ['gold', 'terracotta'], sage: ['terracotta', 'gold'] };
  const woolInst = style.wool();
  const V = [5, 3.5, 7, 3, 6, 4.5], ranks = [], turners = [];
  for (let r = 0; r < 6; r++) {
    const z = RANK_Z[r], s = Math.pow(1.08, r), sp = 112*s, kind = 0;
    const g = facing('rank-' + r); g.position.z = z; g.userData.r = r;
    const rw = RANKW[r % 5], others = ['terracotta', 'bluegreen', 'gold', 'olive', 'blue', 'sage'].filter((w) => w !== rw && (w !== 'sage' || S.lotName === 'green') && (w !== 'blue' || S.lotName !== 'green'));
    for (let v = 0; v < 2; v++) {
      const fb = new FlatBuilder();
      const W = {
        strakes: [0, 1, 2, 3].map((i) => others[(i*3 + v + r) % others.length]).concat([rw]),
        sail: v ? [rw, ACC[rw][1], rw, ACC[rw][0], rw, ACC[rw][1]] : [rw, ACC[rw][0], rw, ACC[rw][1], rw, ACC[rw][0]],
        post: lot.lead[(r + 3 + v) % 5], shield: [lot.lead[(r + 1) % 5], lot.lead[(r + 4) % 5] === lot.lead[(r + 1) % 5] ? 'buff' : lot.lead[(r + 4) % 5]],
      };
      setSmooth(0.6); ship(fb, 0, s, W, { seg: 12, kind, men: true, heads: 3 + ((r + v) % 2), phase: rng.range(0, 6.28), }); setSmooth(1);
      await ctx.yield();
      const im = new THREE.InstancedMesh(fb.build(), woolInst, 4); im.name = 'ships-' + r + '-' + v; im.frustumCulled = false;
      const m4 = new THREE.Matrix4(), xs = [];
      for (let j = 0; j < 4; j++) {
        let x = ((j*2 + v) - 3.5)*sp;
        // rank four makes room for the flagship: her place is left empty, the ships astern and ahead of her stand off
        if (r === 3) { const q = j*2 + v; x = q === 3 ? 9000 : q > 3 ? x + 34 : x - 26; }
        xs.push(x); m4.makeTranslation(xs[j], 0, 0); im.setMatrixAt(j, m4);
      }
      im.instanceMatrix.needsUpdate = true; g.add(im); turners.push({ im, xs, z, v });
      await ctx.yield();
    }
    // where the rail crosses this rank a gap between two ships must be: the slide is keyed to u, not to the clock
    const c = atZ(z), want = -c.x, vel = (r === 3 ? 1.5 : V[r])*speedK;
    const slide0 = -vel*DURATION*c.u;                     // the slide when the rank is first seen
    let best = 0, bd = 1e9;
    const gapC = r === 0 ? 63 : r >= 4 ? 62 : 58.5;                     // the middle of the gap between a prow and the next stern
    for (let j = 0; j < 8; j++) { const gc = (j - 3.5)*sp + gapC*s, d = Math.abs(gc - (want - (r === 3 ? 0 : slide0*0))); if (d < bd) { bd = d; best = j; } }
    let align = want - ((best - 3.5)*sp + gapC*s);
    // the flagship (rank four) stands with its mast FLAG_X to port of the course's origin when the rail reaches its rank,
    // so the laid route's dive comes down facing its side; the eye crosses before its face, and the slant passes close under its prow
    if (r === 3) { best = 3; align = -FLAG_X - (best - 3.5)*sp; }
    // the two ships either side of the rail stand off a little more, so neither post is pressed against the eye as we go through
    else for (const t of turners.slice(-2)) for (let j = 0; j < 4; j++) t.xs[j] += (j*2 + t.v <= best ? -1 : 1)*(r === 0 ? 7 : r === 5 ? 4 : 15);
    let lead = null;
    if (r === 4) {
      // one more ship in rank five's wools stands LEAD_AHEAD m beyond her rank, between it and rank six, and is built LEAD_K
      // larger (a transform of her instance): the one great ship of the last third. She keeps her own slow way (1.5 m/s)
      // and stands with her beast's nose LEAD_OFF m to port of the rail where the rail comes to her
      const vb = (best + 1) % 2, ze = z + LEAD_AHEAD, cL = atZ(ze);
      const im = new THREE.InstancedMesh(turners[turners.length - 2 + vb].im.geometry, woolInst, 1); im.name = 'ship-lead'; im.frustumCulled = false; g.add(im);
      const thL = []; shipEnds(thL, 0, s, 40, S.detail);
      const endsL = new THREE.Mesh(makeFringe(thL, 9), style.thread({ ride: 1 })); endsL.name = 'loose-ends-lead-ship'; endsL.frustumCulled = false; g.add(endsL);
      lead = { j: 0, zl: -LEAD_AHEAD, z: ze, k: LEAD_K, xw: cL.x + LEAD_OFF + 44.5*s*LEAD_K, uP: cL.u, vel: 1.5*speedK, ends: endsL };
      turners.push({ im, xs: [0], z: ze, v: vb, lead });
      await ctx.yield();
    }
    if (r === 5) {
      // free wool: long loose ends hang from both yard-arms, the prow beast's jaw and the stern post of every ship of the rank
      const th = [];
      for (const tt of turners.slice(-2)) for (let j = 0; j < 4; j++) shipEnds(th, tt.xs[j], s, j*7 + tt.v*3, S.detail);
      const ends = new THREE.Mesh(makeFringe(th, 9), style.thread({ ride: 1 })); ends.name = 'loose-ends-rank-six'; ends.frustumCulled = false; g.add(ends);
      await ctx.yield();
    }
    ranks.push({ g, r, z, s, sp, vel, uc: c.u, align, flagX: (best - 3.5)*sp });
    if (lead) lead.R = ranks[ranks.length - 1];
    if (r === 3) {
      await ctx.yield();
      const fb = new FlatBuilder(); flagship(fb, lot, rng.range(0, 6.28)); await ctx.yield();
      const m = new THREE.Mesh(fb.build(), S.woolStand); m.name = 'flagship'; m.frustumCulled = false; m.position.x = (best - 3.5)*sp; g.add(m);
      await ctx.yield();
    }
  }
  {
    const fb = new FlatBuilder(), s = 1.5;
    ship(fb, 0, s, { strakes: lot.lead, sail: lot.sail, post: lot.lead[1], shield: [lot.lead[0], lot.lead[2]] }, { men: true, heads: 4, seg: 12, phase: 2.2 });
    const im = new THREE.InstancedMesh(fb.build(), woolInst, 4); im.name = 'ships-drawn'; im.frustumCulled = false;
    const g = facing('rank-drawn'); g.position.z = DRAWN_Z; const m4 = new THREE.Matrix4();
    const xs = [-250, -80, 76, 246].map((x) => -XE + x);
    xs.forEach((x, j) => { m4.makeTranslation(x, 0, 0); im.setMatrixAt(j, m4); }); im.instanceMatrix.needsUpdate = true; g.add(im); turners.push({ im, xs, z: DRAWN_Z });
    S.drawn = { g, xs, s };
    await ctx.yield();
    await ctx.yield();
  }
  // water is drawn, not filled: three wavy stem-stitch lines lying across the cloth under each rank (and one set at the shore)
  const wfb = new FlatBuilder(), wfb2 = new FlatBuilder(), wfb3 = new FlatBuilder();   // far water, near water, ground (which does not run)
  const WZ = [500, ...RANK_Z];
  for (let k = 0; k < WZ.length; k++) for (let i = 0; i < 3; i++) {
    const z0 = WZ[k] - 5 - i*6.5*(1 + k*0.06), pts = [], ph = rng.range(0, 6.28), wl = 34;
    for (let j = 0; j <= 184; j++) { const x = -598 + j*6.5; pts.push([x, -(z0 + 1.7*Math.sin(x/wl*6.2832 + ph) + 0.5*Math.sin(x/17*6.2832 + i))]); }
    wfb.rope(pts, i === 1 ? 'dark' : (i + k) % 2 ? 'blue' : 'bluegreen', i === 1 ? 1.2 : 0.95, { z: 0.1 });
    if (i === 2) await ctx.yield();
  }
  for (let k = 0; k < 7; k++) rng.range(0, 6.28);                // (seven draws kept, so every edition's later draws stay as they were)
  for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) {      // past rank six the sea is worked the same way: a set of three under the
    const hv = Math.sin((k*3 + i)*127.1 + 61*311.7)*43758.5453, ph = 6.2832*(hv - Math.floor(hv));
    const z0 = DRAWN_Z - 106 + k*53 - 5 - i*8.5, pts = [];        // landing rank, two before it and one beyond
    for (let j = 0; j <= 184; j++) { const x = -598 + j*6.5; pts.push([x, -(z0 + 1.7*Math.sin(x/34*6.2832 + ph) + 0.5*Math.sin(x/17*6.2832 + i))]); }
    wfb.rope(pts, i === 1 ? 'dark' : (i + k) % 2 ? 'blue' : 'bluegreen', i === 1 ? 1.2 : 0.95, { z: 0.1 });
  }
  {                                                              // near the rail the cloth is worked close: a line every few metres,
    let n = 0;                                                   // ground lines in the shore's wools, then water lines in the sea's
    const NEARX = []; for (let j = 0; j <= 70; j++) NEARX.push(j < 9 ? -330 + j*30 : j <= 61 ? -60 + (j - 9)*(120/52) : 60 + (j - 61)*30);   // fine steps under the eye
    const LAND = ['olive', 'terracotta', 'sage', 'buff', 'olive', 'bluegreen'], SEA = ['bluegreen', 'dark', 'blue', 'bluegreen', 'blue', 'dark', 'olive'], DEEP = ['dark', 'blue', 'bluegreen', 'dark', 'blue', 'dark', 'bluegreen'];
    // (the sea is worked closest of all under the flagship: a band of dark, blue and blue-green lines, never a filling)
    for (let z0 = 6; z0 < 1392; z0 += (z0 < 22 ? 3.9 : z0 < 320 ? 7.8 : z0 > 729 && z0 < 845 ? 3.3 : 4.5 + 1.0*Math.sin(n*2.4))) {
      if (WZ.some((w) => z0 > w - 24 && z0 < w - 2) || (z0 > 34 && z0 < 44)) { n++; continue; }
      const land = z0 < 320, deep = z0 > 729 && z0 < 845, cx = -atZ(z0).x, pts = [], ph = 1.9*n + 0.6*Math.sin(n*12.9898)*3, wl = land ? 58 : 34, amp = land ? 2.0 : 1.5;
      for (let j = 0; j <= 70; j++) { const x = cx + NEARX[j]; pts.push([x, -(z0 + amp*Math.sin(x/wl*6.2832 + ph) + 0.4*Math.sin(x/17*6.2832 + n))]); }
      const w = land ? LAND[n % 6] : deep ? DEEP[n % 7] : SEA[n % 7];
      (land ? wfb3 : wfb2).rope(pts, w, (w === 'dark' ? 1.45 : land ? 1.0 : 1.25)*(deep ? 1.25 : 1), { z: 0.1 });
      if (++n % 3 === 0) await ctx.yield();
    }
  }
  for (let k = 0; k < 4; k++) {                                  // the ground the first border stands on, at our feet in the first frame
    const z0 = 27.5 + k*3.1, pts = [], ph = 0.9 + k*1.7;
    for (let j = 0; j <= 62; j++) { const x = -155 + j*5; pts.push([x, -(z0 + 0.9*Math.sin(x/29*6.2832 + ph))]); }
    wfb3.rope(pts, ['olive', 'terracotta', 'bluegreen', 'buff'][k], 0.8, { z: 0.1 });
  }
  for (let k = 0; k < 5; k++) {                                  // the shore: single ground lines under the trees and horses
    const z0 = [66, 128, 186, 246, 302][k], pts = [], ph = rng.range(0, 6.28);
    for (let j = 0; j <= 184; j++) { const x = -598 + j*6.5; pts.push([x, -(z0 + 2.2*Math.sin(x/68*6.2832 + ph) + 0.6*Math.sin(x/17*6.2832 + k))]); }
    wfb3.rope(pts, ['olive', 'terracotta', 'sage', 'olive', 'bluegreen'][k], 0.7, { z: 0.1 });
  }
  for (let k = 0; k < 4; k++) {                                  // and between the star and the second border, so the cloth under the dive is worked
    const z0 = [346, 378, 412, 444][k], pts = [], ph = 1.3 + k*2.1;
    for (let j = 0; j <= 184; j++) { const x = -598 + j*6.5; pts.push([x, -(z0 + 1.9*Math.sin(x/34*6.2832 + ph) + 0.5*Math.sin(x/17*6.2832 + k))]); }
    wfb.rope(pts, ['blue', 'bluegreen', 'dark', 'bluegreen'][k], 0.7, { z: 0.1 });
  }
  await ctx.yield();
  const water = new THREE.Mesh(wfb.build(), style.wool({ lie: 1 })); water.rotation.x = -Math.PI/2; water.position.y = 0.8; water.frustumCulled = false; water.name = 'water-lines'; scene.add(water);
  await ctx.yield();
  const water2 = new THREE.Mesh(wfb2.build(), water.material); water2.rotation.x = -Math.PI/2; water2.position.y = 0.8; water2.frustumCulled = false; water2.name = 'water-between'; scene.add(water2);
  await ctx.yield();
  const ground = new THREE.Mesh(wfb3.build(), water.material); ground.rotation.x = -Math.PI/2; ground.position.y = 0.8; ground.frustumCulled = false; ground.name = 'ground-lines'; scene.add(ground);
  await ctx.yield();
  const slideOf = (R, u) => R.align + R.vel*DURATION*(u - R.uc) + R.early*(1 - sstep(0.03, 0.2, u));
  // the first sight of the fleet, from the shore: one sail of the first rank stands in the middle of the frame and a sail
  // of every rank behind stands in line with it, each a step higher, so the fleet is counted as separate stacked sails with
  // bare cloth between; then the ranks slide out of line (all of it keyed to u)
  for (const R of ranks) R.early = 0;
  for (const R of ranks) {
    const base = slideOf(R, 0) - 3.5*R.sp, d = (((0 - base) % R.sp) + R.sp) % R.sp;
    R.early = d > R.sp/2 ? d - R.sp : d;
  }
  // fish leap out of the bare cloth between the water lines, near the rail, all to starboard
  const fishG = facing('fish'), fishes = [], nFish = Math.round(30*S.detail), fr = (i, k) => { const v = Math.sin(i*127.1 + k*311.7)*43758.5453; return v - Math.floor(v); };
  for (let v = 0; v < 2; v++) {
    const fb = new FlatBuilder(); fishFlat(fb, lot.lead[v ? 2 : 1], lot.lead[v ? 4 : 0]);
    const im = new THREE.InstancedMesh(fb.build(), woolInst, nFish); im.name = 'fish-' + v; im.frustumCulled = false; fishG.add(im);
    for (let i = 0; i < nFish; i++) {
      const z = 492 + (i + 0.5*v + 0.6*fr(i, v))*(880/nFish), c = atZ(z), sd = (i + v) % 2 ? 1 : -1;
      fishes.push({ im, i, z, x: -c.x + sd*(27 + 55*fr(i, v + 3)*fr(i, v + 5)), ph: fr(i, v + 7), T: 2.6 + 1.6*fr(i, v + 9), s: 1.2 + 0.7*fr(i, v + 11), h: 6 + 6*fr(i, v + 13) });
    }
    await ctx.yield();
  }
  // ---- more of the lower border's work, STANDING either side of the rail all the way, every piece frontal and in profile
  // like the rest: its fish in the sea among the water lines, confronted across the rail and swimming on the spot; on the
  // shore its long-necked birds and three-leaf sprigs. (Nothing lies on the cloth but the water lines.)
  const stood = [], standG = facing('border-work');
  const standIM = (geo, n, name) => { const im = new THREE.InstancedMesh(geo, woolInst, n); im.name = name; im.frustumCulled = false; standG.add(im); return im; };
  const clearOf = (z, obs, gap) => { for (const o of obs) if (Math.abs(z - o) < gap) z = o - gap; return z; };
  {
    const nLay = Math.round(24*S.detail), OBS = [470, ...RANK_Z, RANK_Z[4] + LEAD_AHEAD, 978, 1170, DRAWN_Z];
    for (let v = 0; v < 2; v++) {
      const im = standIM(fishG.children[v].geometry, nLay, 'swim-fish-' + v);
      for (let i = 0; i < nLay; i++) {
        const k = i*2 + v, sd = (i + v) % 2 ? 1 : -1, z = clearOf(338 + (k + 0.5)*((DRAWN_Z - 338)/(2*nLay)), OBS, 14), s = 1.5 + 0.6*fr(k, 33);   // (from the shore's edge to the landing rank: the sea)
        stood.push({ im, i, z, off: sd*(12 + 36*fr(k, 31)*fr(k, 37) + (i % 3)*5), dir: sd, s, y: 1.3 + 2.5*s, ph: 6.28*fr(k, 35), sway: 3.5 });   // (whole above the cloth, its lower fin on the lines)
      }
      await ctx.yield();
    }
    const TW = lot.lead, LOBS = [64, 152, 168, 238, 288];   // (the first pair of birds stands in the first border's gateway, confronted across the rail)
    const bb = new FlatBuilder(); beastBird(bb, -9, -6, 1, 1, { a: TW[1], b: TW[0] }, 0.8);
    const sb = new FlatBuilder(); sprig(sb, 0, -5, 10, 'olive', TW[2]);
    await ctx.yield();
    const nB = Math.round(8*S.detail), nS = Math.round(18*S.detail), birdsL = standIM(bb.build(), nB, 'stood-birds'), sprigsL = standIM(sb.build(), nS, 'stood-sprigs');
    for (let i = 0; i < nB; i++) {
      const sd = i % 2 ? 1 : -1, z = i < 2 ? 36 : clearOf(60 + (i - 2 + 0.3*fr(i, 41))*(262/Math.max(1, nB - 2)), LOBS, 20), s = i < 2 ? 0.44 : 0.36 + 0.1*fr(i, 45);
      stood.push({ im: birdsL, i, z, off: sd*(i < 2 ? 7.6 : 12 + 22*fr(i, 43)), dir: sd, s, y: 0.9 + 5.7*s, ph: 6.28*fr(i, 47), sway: 0 });
    }
    for (let i = 0; i < nS; i++) {
      const sd = i % 2 ? -1 : 1, z = clearOf(50 + (i + 0.3*fr(i, 51))*(272/nS), LOBS, 22), s = 0.8 + 0.36*fr(i, 55);   // (none stands at a horse's feet or a tree's root)
      stood.push({ im: sprigsL, i, z, off: sd*(26 + 30*fr(i, 53)), dir: sd, s, y: 0.9 + 5*s, ph: 0, sway: 0 });
    }
    for (const L of stood) L.x = atZ(L.z).x + L.off;
    await ctx.yield();
  }
  const sq = new THREE.Quaternion(), se = new THREE.Euler(), sp = new THREE.Vector3(), ss = new THREE.Vector3();
  const placeStood = (time) => {
    for (const L of stood) {
      const dx = L.sway ? L.sway*Math.sin(time*0.3 + L.ph) : 0, bob = L.sway ? 0.3*Math.sin(time*0.8 + L.ph) : 0;
      se.set(0, 0, L.sway ? 0.07*Math.sin(time*0.6 + L.ph) : 0); sq.setFromEuler(se);
      tm.compose(sp.set(-(L.x + dx), L.y + bob, -L.z), sq, ss.set(L.dir*L.s, L.s, 1)); L.im.setMatrixAt(L.i, tm);
    }
  };
  const fq = new THREE.Quaternion(), fe = new THREE.Euler(), fs = new THREE.Vector3(), fpz = new THREE.Vector3();
  const fp = new THREE.Vector3(), dir = new THREE.Vector3(), tm = new THREE.Matrix4();
  placeStood(0); for (const L of stood) L.im.instanceMatrix.needsUpdate = true;
  const swimFish = [stood[0].im, stood.find((L) => L.im.name === 'swim-fish-1').im];
  return {
    ranks,
    // a point on the flagship's rail amidships (world), for the gaze
    flagPoint(u) { const R = ranks[3]; return fp.set(-(R.flagX + slideOf(R, u) + 16*R.s), 13, R.z); },
    update(dt, time, camera, u, camPos) {
      // far ranks step up the frame by their distance ahead (16 m a rank; depth is a step up, not a dwindling) and stand higher yet while we are low on the shore: that further step (15 m a rank) is gone from 40 m up and comes back wherever the eye comes lower, as where it crosses before the flagship's face (there only the sixth rank is far enough to be moved)
      const low = 1 - sstep(18, 40, camPos.y);   // from the shore the far ranks stand higher still
      for (const R of ranks) { R.g.position.x = -slideOf(R, u); R.g.position.y = R.r*(STEP_UP + 15*low)*sstep(250, 540, R.z - camPos.z); }
      // every ship turns its face square to the gaze (up to 30 degrees), so no flat shows a side: a transform only
      camera.getWorldDirection(dir);
      const th = Math.max(-0.52, Math.min(0.52, Math.atan2(dir.x, Math.max(dir.z, 1e-3))));
      for (const t of turners) {
        // ...but a rank stands square to the course again as the rail reaches it, so the gap we pass through is where it was built
        tm.makeRotationY(th*sstep(22, 85, t.z - camPos.z));
        for (let j = 0; j < t.xs.length; j++) { tm.setPosition(t.xs[j], 0, 0); t.im.setMatrixAt(j, tm); }
        if (t.lead) {
          const L = t.lead, a = th*sstep(22, 85, L.z - camPos.z), xl = -L.xw + L.vel*DURATION*(u - L.uP) - slideOf(L.R, u);
          fe.set(0, a, 0); fq.setFromEuler(fe); tm.compose(fpz.set(xl, 0, L.zl), fq, fs.set(L.k, L.k, L.k)); t.im.setMatrixAt(L.j, tm);
          L.ends.position.set(xl, 0, L.zl); L.ends.rotation.y = a; L.ends.scale.setScalar(L.k);
        }
        t.im.instanceMatrix.needsUpdate = true;
      }
      water.position.x = (time*1.6) % 34; water2.position.x = -((time*1.1) % 34);
      for (const f of fishes) {
        // one leap in each cycle: up out of the cloth, over, and in again some metres to starboard; between leaps it is under the cloth
        const t = time/f.T + f.ph, c = t - Math.floor(t), a = Math.min(1, c/0.72), up = Math.sin(Math.PI*a), y = 2.5 + f.h*up, k = f.s*Math.min(1, up*3.5)*sstep(22, 48, Math.abs(f.z - camPos.z));   // (it comes out of the cloth small and whole, never cut by it)
        fe.set(0, 0, 0.8*Math.cos(Math.PI*a)); fq.setFromEuler(fe);
        tm.compose(fpz.set(f.x + 16*f.s*(c - 0.5), y, -f.z), fq, fs.set(k, k, k)); f.im.setMatrixAt(f.i, tm);
      }
      for (let v = 0; v < 2; v++) fishG.children[v].instanceMatrix.needsUpdate = true;
      placeStood(time); swimFish[0].instanceMatrix.needsUpdate = swimFish[1].instanceMatrix.needsUpdate = true;   // (only the fish swim)
    },
  };
}

// ---- the exit: a round-headed arch on two columns under a scalloped roof, in full wool; it stands on the last border --
function archWork(S, fb, cx, y0, zb) {
  fb.zb = zb; fb.z = 0.4;                                       // the caller has placed and scaled it with fb.at()
  const yS = y0 + 11, rI = 9.2, rO = 13.6;
  for (const sd of [-1, 1]) {                                   // both columns worked in stripes
    const k = 0, xa = cx + sd*rI, xb = cx + sd*rO, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    for (let i = 0; i < 7; i++) { const ya = y0 + 1.2 + i*1.257, w = i % 2 ? 'terracotta' : 'gold'; fb.shape([[x0, ya], [x1, ya], [x1, ya + 1.257], [x0, ya + 1.257]], w, i % 2 ? 'dark' : 'terracotta', 0, { inset: 0.14, kind: k, width: 0.26 }); }
    fb.shape([[x0 - 0.7, y0 + 0.2], [x1 + 0.7, y0 + 0.2], [x1 + 0.3, y0 + 1.2], [x0 - 0.3, y0 + 1.2]], 'bluegreen', 'dark', 0, { inset: 0.14, kind: k });
    fb.shape([[x0 - 0.3, yS - 1.0], [x1 + 0.3, yS - 1.0], [x1 + 0.9, yS], [x0 - 0.9, yS]], 'blue', 'gold', 0, { inset: 0.14, kind: k });
  }
  for (let i = 0; i < 9; i++) {                                 // voussoirs, every one laid
    const a0 = Math.PI - i*Math.PI/9, a1 = a0 - Math.PI/9, pts = [];
    for (let j = 0; j <= 4; j++) { const a = a0 + (a1 - a0)*j/4; pts.push([cx + Math.cos(a)*rO, yS + Math.sin(a)*rO]); }
    for (let j = 4; j >= 0; j--) { const a = a0 + (a1 - a0)*j/4; pts.push([cx + Math.cos(a)*rI, yS + Math.sin(a)*rI]); }
    const w = ['terracotta', 'gold', 'bluegreen'][i % 3];
    fb.shape(pts, w, lineFor(w), (a0 + a1)/2 + Math.PI/2, { inset: 0.16, kind: 0, width: 0.28 });
  }
  // the wall over it and the scalloped tile roof, worked
  const ry = yS + rO + 1.4, wh = rO + 1.8;
  fb.rope([[cx - wh, yS], [cx - wh, ry], [cx + wh, ry], [cx + wh, yS]], 'dark', 0.4);
  fb.shape([[cx - wh - 3, ry], [cx + wh + 3, ry], [cx + wh - 2, ry + 7.4], [cx - wh + 2, ry + 7.4]], 'terracotta', 'dark', 0, { inset: 0.2, kind: 0, width: 0.42 });
  for (let r = 0; r < 3; r++) {
    const y = ry + 0.5 + r*2.3, half = wh + 1.6 - r*1.5, n = 12 - r, pts = [];
    for (let i = 0; i < n; i++) for (let j = 0; j <= 6; j++) { const a = Math.PI*j/6; pts.push([cx - half + (i + 0.5 - 0.5*Math.cos(a))*(2*half/n), y + Math.sin(a)*1.9]); }
    fb.rope(pts, r % 2 ? 'gold' : 'linen', 0.42);                  // the tiles: three rows of scallops couched over the terracotta
  }
  fb.shape(lobed(cx, ry + 9.4, 1.9, Math.PI/2, 4), 'gold', 'terracotta', 0, { inset: 0.15, kind: 0 });
  // the doorway is hung as the hanging's own doorways are: a curtain each side, drawn back and knotted round its column,
  // swaying on the intrados; and a valance of scallops couched under the arch. The middle (19 m at the crown, 29 m at
  // the eye's height) is open
  for (const sd of [-1, 1]) {
    const P = (d, y) => [cx + sd*d, y], rC = rI - 0.12, yT = y0 + 7.0;
    fb.hinge(sd*rC, yS + 5, 0.022, 0.6, sd*1.3);
    const drape = []; for (let j = 0; j <= 7; j++) { const a = 1.08*j/7; drape.push(P(rC*Math.cos(a), yS + rC*Math.sin(a))); }
    const top = drape[7], dT = rC*Math.cos(1.08), hT = yS + rC*Math.sin(1.08);
    for (const q of smoothLoop([[dT, hT], [dT + 0.5, yS + 4.4], [dT + 1.5, yS + 0.8], [6.9, yS - 2.2], [7.5, yT + 0.4]], 4, false).slice(1)) drape.push(P(q[0], q[1]));
    drape.push(P(rC, yT + 0.4));
    fb.shape(drape, 'terracotta', 'dark', Math.PI/2, { inset: 0.16, width: 0.3 });
    for (let j = 0; j < 4; j++) {                               // folds, gathered to the knot
      const a = 0.16 + 0.24*j, d0 = rC*Math.cos(a), h0 = yS + rC*Math.sin(a) - 0.4;
      fb.rope(smoothLoop([[d0, h0], [d0 + 0.35 + 0.1*j, (h0 + yT)/2 + 1.2], [8.6 - 0.32*j, yT + 0.9]], 4, false).map((q) => P(q[0], q[1])), j % 2 ? 'gold' : 'linen', 0.3);
    }
    fb.shape([P(rC, y0 + 1.3), P(5.4, y0 + 1.3), P(6.3, y0 + 3.6), P(7.2, y0 + 5.4), P(7.6, yT - 0.4), P(rC, yT - 0.4)], 'bluegreen', 'dark', Math.PI/2, { inset: 0.16, width: 0.3 });
    for (let j = 0; j < 3; j++) fb.rope([P(8.5 - 0.35*j, yT - 0.6), P(8.2 - 1.0*j, y0 + 1.5)], j % 2 ? 'linen' : 'gold', 0.28);
    fb.shape([P(7.1, yT - 0.5), P(rC + 0.1, yT - 0.5), P(rC + 0.1, yT + 0.5), P(7.1, yT + 0.5)], 'gold', 'terracotta', 0, { inset: 0.12, width: 0.26 });
    fb.shape(lobed(cx + sd*6.9, yT, 1.0, sd > 0 ? Math.PI : 0), 'gold', 'terracotta', 0, { inset: 0.1, width: 0.24 });
    fb.noHinge();
  }
  {
    const pts = [], n = 7, a0 = 1.14, rV = rI - 0.25;           // the valance: seven scallops between the curtains' heads
    for (let i = 0; i < n; i++) for (let j = 0; j <= 5; j++) { const a = Math.PI - a0 - (Math.PI - 2*a0)*(i + j/5)/n, dip = 0.95*Math.sin(Math.PI*j/5); pts.push([cx + Math.cos(a)*(rV - dip), yS + Math.sin(a)*(rV - dip)]); }
    fb.rope(pts, 'terracotta', 0.42); fb.rope(pts.map((q) => [q[0], q[1] - 0.5]), 'bluegreen', 0.3);
  }
  fb.at();
}

// ---- the birds that leave the border: perched in the star's span, they burst at u 0.31 and dive ahead of us ---------
function flyingBird(fb, A, B) {
  const ln = lineFor(A) === B ? 'dark' : lineFor(A), lb = lineFor(B) === A ? 'dark' : lineFor(B);
  fb.at(0, 0, 1, 1);
  fb.hinge(0.2, 0.3, 0.55, 8.5, 1.2);                                                           // far wing, other wool
  fb.shape(smoothLoop([[0.9, 0.3], [0.3, 2.4], [-1.5, 3.9], [-2.1, 3.1], [-1.1, 1.6], [-0.9, 0.2]], 3), B, lb, 2.0, { inset: 0.1, width: 0.2 });
  fb.noHinge();
  fb.shape(smoothLoop([[-1.2, 0.5], [-3.6, 1.3], [-4.0, 0.5], [-3.0, 0.1], [-3.9, -0.6], [-1.4, -0.5]], 3), B, lb, 0.1, { inset: 0.1, width: 0.2 });   // tail
  fb.shape(smoothLoop([[-1.9, 0.2], [-0.6, 1.0], [1.3, 1.0], [2.4, 1.5], [3.3, 1.2], [3.4, 0.5], [2.4, 0.1], [1.2, -0.9], [-0.8, -0.8]], 4), A, ln, 0.1, { inset: 0.12, width: 0.22 });
  fb.shape([[3.3, 1.1], [4.5, 0.6], [3.4, 0.4]], B === 'gold' ? 'terracotta' : 'gold', ln, 0, { inset: 0.05, width: 0.16 });
  fb.disc(2.75, 1.0, 0.2, 'linen', ln, 0, 6, { inset: 0, kind: 2, width: 0.14 });
  fb.hinge(0.2, 0.3, 0.6, 8.5, 0);                                                              // near wing
  fb.shape(smoothLoop([[1.1, 0.4], [0.9, 2.6], [-0.7, 4.4], [-1.5, 3.7], [-0.7, 2.0], [-0.8, 0.3]], 3), A, ln, 2.0, { inset: 0.1, width: 0.2 });
  fb.rope([[0.5, 1.0], [-0.6, 3.4]], lb, 0.16); fb.rope([[0.0, 0.9], [-0.9, 2.6]], lb, 0.16);
  return fb.noHinge().at();
}
async function buildBirds(S) {
  const { rng, lot, style, path, detail, scene, ctx, uS, atZ } = S;   // (path here is the LAID route: where the eye's route leaves it at the flagship, the birds keep to the laid one, up to her yard and down to her beast)
  const N = Math.round(60*detail*Math.min(1.3, Math.max(0.7, (ctx.vary && ctx.vary.density) || 1))), per = Math.ceil(N/3), mat = style.wool({ ride: 0 });
  const meshes = [], birds = [];
  const uB = uS + 0.004, s31 = uB*path.length, sEnd = path.length*0.70;
  const uB2 = atZ(RANK_Z[3] + 20).u, late3 = atZ(978).u - uB2, s65 = uB2*path.length, sRelay = atZ(978).u*path.length;
  const uSet0 = atZ(1170).u, uSet1 = atZ(DRAWN_Z).u;   // (the relay pair settle between the fifth lower border and the landing rank)   // (they leave as the rail clears the flagship's rank; two more as it crosses the third lower border)
  const sEnd2 = path.length*0.955, bh = (i, k) => { const v = Math.sin(i*127.1 + k*311.7)*43758.5453; return v - Math.floor(v); };
  for (let v = 0; v < 3; v++) {
    const fb = new FlatBuilder(); flyingBird(fb, lot.lead[(v*2) % 5], lot.lead[(v*2 + 3) % 5]);
    const im = new THREE.InstancedMesh(fb.build(), mat, per); im.frustumCulled = false; im.name = 'birds-' + v; scene.add(im); meshes.push(im);
    for (let i = 0; i < per; i++) {
      const k = v*per + i, close = k < 2;
      // perch: on the lower rope and the bars of the first span, either side of the fringe gate; roost: the second span
      const px = rng.chance(0.5) ? rng.range(12, 200) : -rng.range(62, 220), py = 71.2 + (rng.chance(0.3) ? 34 : 0);
      birds.push({
        im, i, perch: close ? new THREE.Vector3(k ? -17 : 19, 71.2, 329.2) : new THREE.Vector3(px, py, 329.2), roost: new THREE.Vector3(-XE*0 + XE + rng.range(-170, 170), 58 + rng.range(0, 30), 999),
        // the nearest pair leave first and fly a little ahead of each shoulder, whole in the frame, then pull away
        lead: close ? 25 + k*3 : rng.range(18, 130), gain: close ? 0.05 : rng.range(0.4, 0.75), acc: close ? 0.0008 : 0,
        dx: close ? (k ? -15 : 15) : (rng.chance(0.5) ? 1 : -1)*rng.range(8, 56), dy: close ? -7 + k : rng.range(-12, 12),
        size: close ? 1.5 : rng.range(0.6, 0.9), ph: rng.range(0, 6.28), late: close ? -0.036 : rng.range(0, 0.012),
        // the second flight: as we come out from under the flagship they leave the second span and go ahead of us over
        // the ranks where the wool runs out, in the upper register, and settle on the ropes of the last span over the arch
        lead2: close ? 26 + k*4 : 34 + 150*bh(k, 1), gain2: close ? 0.1 : 0.3 + 0.5*bh(k, 2), acc2: close ? 0.012 : 0, dx2: close ? (k ? -15 : 14) : (bh(k, 3) < 0.5 ? 1 : -1)*(8 + 78*bh(k, 4)),
        dy2: close ? 11 + 2*k : 0, late2: close ? -0.012 : 0.02*bh(k, 5), size2: close ? 1.7 : 0.8 + 0.5*bh(k, 6),
        roost2: new THREE.Vector3(XE + (bh(k, 7) - 0.5)*330, bh(k, 8) < 0.3 ? 105.2 : 71.2, 1419.2),
      });
      { const b = birds[birds.length - 1]; b.off2 = sRelay - s65;
        // a relay, by places in the world: the nearest pair fly at our shoulders from the flagship's rank (z 867) to the third lower
        // border (z 978) and pull away there; two more, of the other two kinds, leave that border as we cross it and fly at our
        // shoulders until the rail crosses the fifth lower border (z 1170), and are on the ropes of the last span when it crosses the landing rank
        if (i === 0 && v > 0) Object.assign(b, { lead2: 25 + 3*v, gain2: 0, acc2: 0, off2: 0, dx2: v === 1 ? -10 : 12, dy2: 8.5 + v, late2: late3, size2: 1.7, shoulder: true });
        else if (!close) { b.dy2 = b.lead2*(0.25 + 0.27*bh(k, 9)); b.dx2 = (bh(k, 3) < 0.5 ? 1 : -1)*b.lead2*(0.1 + 0.85*bh(k, 4)); } }   // spread over the upper register, clear of the sails
    }
    await ctx.yield();
  }
  // THE BURST KEEPS OFF THE LENS, BY THE PERCH'S PLACE (the owner's rule: a body is kept off the lens by its place, with 2 m of
  // clear air; 2.03 m here). Some birds are dealt a perch on one side of the route and a place in the flock on the other, and
  // crossed the eye's line as they left the rope while we went under it. Such a bird's perch slides along its own rope, the
  // nearest place first (half a metre at a time, outward first, never past the ends of its side of the rope), until the bird
  // keeps 2.03 m from the eye's line while it sits and all the way out to its place in the flock. A bird with no such place stays.
  // It is asked for every beat of the wings, every phase of the sway and of the rocking at once, so the answer is the same at
  // every entry clock: along each of 32 directions in the flat's own plane, the eye's place less the flat's reach that way over
  // its whole beat (a hinged point sweeps an arc about its pivot) less the sway's reach is never more than the true distance.
  // (The eye flies the laid route here: the two routes part only from z 753 to z 838.) No draw is made and none is moved; the
  // perch is a place fixed at build and nothing here reads the lens or the clock.
  { const FAN = 32, NEED = 2.03, DU = 0.0005, FINE = 20, STEPX = 0.5, SLIDES = 400, TAU = 2*Math.PI, L = path.length, CS = [], SN = [], tables = new Map();
    for (let j = 0; j < FAN; j++) { CS.push(Math.cos(j*TAU/FAN)); SN.push(Math.sin(j*TAU/FAN)); }
    const f = new THREE.Vector3(), tg = new THREE.Vector3(), eye = new THREE.Vector3();
    // a flat's reach along each direction of the fan over its whole beat, its thickness, its widest line and its longest reach
    const tableOf = (g) => {
      let T = tables.get(g); if (T) return T;
      const P = g.attributes.position.array, piv = g.attributes.aPivot.array, sw = g.attributes.aSwing.array, K = g.attributes.aK.array, UV = g.attributes.aUv.array, h = new Float64Array(FAN).fill(-1e9);
      let line = 0, thick = 0, reach = 0;
      for (let k = 0; k < P.length/3; k++) {
        const x = P[k*3], y = P[k*3 + 1], kx = K[k*4], amp = Math.abs(piv[k*3 + 2]);
        thick = Math.max(thick, Math.abs(P[k*3 + 2])); if (kx > 0.5 && kx < 1.5) line = Math.max(line, UV[k*2 + 1]);
        const inset = (kx < 0.5 || kx > 1.5) && K[k*4 + 1] > 0.5 ? Math.hypot(K[k*4 + 2], K[k*4 + 3]) : 0;   // (an edge point drawn back near the lens: counted both ways)
        if (amp > 1e-5) {   // a hinged point: its arc about the pivot (a wheel's point: the whole circle)
          const px = piv[k*3], py = piv[k*3 + 1], r = Math.hypot(x - px, y - py), a0 = Math.atan2(y - py, x - px), A = sw[k*3 + 2] < 0.5 ? amp : Math.PI;
          reach = Math.max(reach, Math.hypot(px, py) + r + inset);
          for (let j = 0; j < FAN; j++) { let d = Math.abs(j*TAU/FAN - a0) % TAU; if (d > Math.PI) d = TAU - d;
            const v = CS[j]*px + SN[j]*py + r*(d <= A ? 1 : Math.cos(d - A)) + inset; if (v > h[j]) h[j] = v; }
        } else { reach = Math.max(reach, Math.hypot(x, y) + inset); for (let j = 0; j < FAN; j++) { const v = CS[j]*x + SN[j]*y + inset; if (v > h[j]) h[j] = v; } }
      }
      T = { h, line, thick, reach }; tables.set(g, T); return T;
    };
    // one moment of a bird's first flight without its sway, by the update's own lines: m[i] - x*m[i + 1] is the eye's x from the
    // bird's middle when its perch stands at x; then the eye's y and z from it, its size, the sway's two reaches, its tilt
    const moment = (b, u, m, i) => {
      const s = u*L, go = sstep(uB + b.late, uB + 0.035 + b.late, u), ds = s - s31, dp = Math.max(0, ds); let sb = s + (b.lead + b.gain*ds + b.acc*dp*dp)*go; const land = sstep(sEnd - 150, sEnd, sb); sb = Math.min(sb, sEnd);
      path.posAtDist(sb, f); path.tangentAtDist(sb, tg); path.posAtDist(s, eye);
      const fx = f.x + b.dx, fy = f.y + b.dy + 2.5*Math.sin(go*Math.PI), w = go*(1 - land);
      m[i] = eye.x - fx*w - b.roost.x*land; m[i + 1] = (1 - go)*(1 - land);
      m[i + 2] = eye.y - ((b.perch.y + (fy - b.perch.y)*go)*(1 - land) + b.roost.y*land); m[i + 3] = eye.z - ((b.perch.z + (f.z - b.perch.z)*go)*(1 - land) + b.roost.z*land);
      m[i + 4] = b.size*(0.8 + 0.2*w); m[i + 5] = 1.5*w; m[i + 6] = 1.2*w; m[i + 7] = go > 0 && land < 1 ? Math.max(-0.5, Math.min(0.5, tg.y*1.2)) : 0;
    };
    // is the eye within need of the bird at that moment, wherever its sway has it, whatever its beat, rocked 0.06 either way
    // (five angles 0.024 apart, each allowed the 0.012 to its neighbour)
    const meets = (T, ox, m, i, need) => {
      const oy = m[i + 2], k = m[i + 4], sx = m[i + 5], sy = m[i + 6], dz = Math.max(0, Math.abs(m[i + 3]) - T.thick*k); if (dz >= need) return false;
      const lim = Math.sqrt(need*need - dz*dz) + 0.012*(Math.hypot(ox, oy) + sx + sy), h = T.h;
      for (let t = -2; t <= 2; t++) { const a = m[i + 7] + t*0.024, ca = Math.cos(a), sa = Math.sin(a); let best = -1e9;
        for (let j = 0; j < FAN && best < lim; j++) { const c = CS[j]*ca - SN[j]*sa, s = SN[j]*ca + CS[j]*sa, v = s*oy - c*ox - k*h[j] - sx*Math.abs(c) - sy*Math.abs(s); if (v > best) best = v; }
        if (best < lim) return true; }
      return false;
    };
    let done = 0;
    for (const b of birds) {
      // from 6 m before the rope (or from its leaving, if it leaves sooner) until it has reached its place in the flock
      const T = tableOf(b.im.geometry), u0 = uB + b.late, ua = Math.min(u0, uS - 0.004), N = Math.ceil((u0 + 0.035 - ua)/DU), C = new Float64Array((N + 1)*8), fine = new Map();
      for (let i = 0; i <= N; i++) moment(b, ua + i*DU, C, i*8);
      const big = T.reach*b.size + 1.93 + NEED + T.line + 0.5;
      const meetsAt = (x) => {
        for (let i = 1; i <= N; i++) {
          const p = (i - 1)*8, q = i*8, x0 = C[p] - x*C[p + 1], x1 = C[q] - x*C[q + 1], step = Math.hypot(x1 - x0, C[q + 2] - C[p + 2], C[q + 3] - C[p + 3]);
          if (Math.min(Math.hypot(x0, C[p + 2], C[p + 3]), Math.hypot(x1, C[q + 2], C[q + 3])) - step > big) continue;   // (out of reach all the way between the two moments)
          let F = fine.get(i); if (!F) { F = new Float64Array((FINE + 1)*8); for (let j = 0; j <= FINE; j++) moment(b, ua + (i - 1 + j/FINE)*DU, F, j*8); fine.set(i, F); }
          for (let j = 0; j <= FINE; j++) { const r = j*8, o = (j ? j - 1 : 1)*8, ox = F[r] - x*F[r + 1], st = Math.hypot(ox - (F[o] - x*F[o + 1]), F[r + 2] - F[o + 2], F[r + 3] - F[o + 3]);
            if (meets(T, ox, F, r, NEED + T.line + 0.75*st + 0.02)) return true; }   // (the widest line's half width; what lies between two moments; 0.02 for what else changes between them)
        }
        return false;
      };
      const from = b.perch.x;
      if (meetsAt(from)) {
        const lo = from > 0 ? 12 : -220, hi = from > 0 ? 200 : -62, out = from > 0 ? 1 : -1; let to = null;
        for (let n = 1; n <= SLIDES && to === null; n++) for (const sg of [out, -out]) { const x = from + sg*n*STEPX; if (x < lo || x > hi) continue; if (!meetsAt(x)) { to = x; break; } }
        if (to !== null) b.perch.x = to;
      }
      if (++done % 6 === 0) await ctx.yield();
    }
  }
  // a skein of great birds crosses over the star's span to starboard while we are on the shore and in the climb (keyed to u):
  // the upper register is never bare cloth; they have gone over by the time we come through the fringe
  const nHigh = Math.max(5, Math.round(8*detail)), high = new THREE.InstancedMesh(meshes[1].geometry, mat, nHigh); high.frustumCulled = false; high.name = 'birds-high'; scene.add(high);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), q2 = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), f = new THREE.Vector3(), sc = new THREE.Vector3(), tg = new THREE.Vector3();
  return {
    update(dt, time, camera, u) {
      const s = u*path.length;
      for (const b of birds) {
        const go = sstep(uB + b.late, uB + 0.035 + b.late, u);
        const ds = s - s31, dp = Math.max(0, ds); let sb = s + (b.lead + b.gain*ds + b.acc*dp*dp)*go; const land = sstep(sEnd - 150, sEnd, sb); sb = Math.min(sb, sEnd);
        path.posAtDist(sb, f); path.tangentAtDist(sb, tg);
        f.x += b.dx + 1.5*Math.sin(time*0.9 + b.ph); f.y += b.dy + 1.2*Math.sin(time*1.3 + b.ph*2) + 2.5*Math.sin(go*Math.PI);
        p.copy(b.perch).lerp(f, go).lerp(b.roost, land);
        const go2 = sstep(uB2 + b.late2, uB2 + 0.034 + b.late2, u);
        let k = b.size*(0.8 + 0.2*go*(1 - land)), air = go > 0 && land < 1;
        if (go2 > 0) {
          const d2 = Math.max(0, s - s65 - b.off2); let sb2 = s + b.lead2 + b.gain2*Math.max(0, s - s65) + b.acc2*d2*d2; const land2 = b.shoulder ? sstep(uSet0, uSet1, u) : sstep(sEnd2 - 130, sEnd2, sb2); sb2 = Math.min(sb2, sEnd2);
          path.posAtDist(sb2, f); path.tangentAtDist(sb2, tg);
          f.x += b.dx2 + 1.5*Math.sin(time*0.9 + b.ph); f.y += b.dy2 + 1.2*Math.sin(time*1.3 + b.ph*2);
          p.lerp(f, go2).lerp(b.roost2, land2);
          k = b.size*0.8 + (b.size2 - b.size*0.8)*go2*(1 - land2); air = land2 < 1;
        }
        e.set(0, 0, (air ? Math.max(-0.5, Math.min(0.5, tg.y*1.2)) : 0) + 0.06*Math.sin(time*2 + b.ph));
        q2.setFromEuler(e); q2.premultiply(q);
        m4.compose(p, q2, sc.set(k, k, k)); b.im.setMatrixAt(b.i, m4);
      }
      for (let i = 0; i < nHigh; i++) {
        const x = 150 - i*36 - 760*u + 3*Math.sin(time*0.5 + i), y = 121 + 9*((i*5) % 3) + 4*bh(i, 91) + 1.6*Math.sin(time*1.1 + i*2.3), k = 2.3 + 0.7*bh(i, 93);
        e.set(0, 0, 0.07*Math.sin(time*1.7 + i)); q2.setFromEuler(e); q2.premultiply(q);
        m4.compose(p.set(x, y, 324 - 2*i), q2, sc.set(k, k, k)); high.setMatrixAt(i, m4);
      }
      high.instanceMatrix.needsUpdate = true;
      for (const im of meshes) im.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---- the end of the cloth: a half-worked knot tree by the arch, loose ends at the last rank, raw warp ends beyond ----
async function buildEnd(S) {
  const { rng, lot, style, facing, addFlat, detail, ctx } = S;
  const grp = facing('end'), fb = new FlatBuilder();
  fb.zb = -1392; knotTree(fb, -XE - 112, 31, lot.lead.slice(0, 4), rng, {});
  await ctx.yield();
  // landfall has its own gate, as the shore had: two great knot trees flank the rail just behind the fifth lower border,
  // their inner boughs crossing overhead, both in full wool
  fb.zb = -1177; knotTree(fb, -XE + 33, 47, lot.lead.slice(0, 4), rng, { over: 0.2 });
  await ctx.yield();
  fb.zb = -1181; knotTree(fb, -XE - 33, 48, lot.lead.slice(0, 4), rng, { over: -0.2 });
  await ctx.yield();
  fb.zb = -1346; knotTree(fb, -XE + 132, 29, lot.lead.slice(0, 4), rng, {});
  await ctx.yield();
  fb.zb = -1393; knotTree(fb, -XE + 118, 33, lot.lead.slice(0, 4), rng, { dir: -1 });
  await ctx.yield();
  // landfall: two horses already ashore, one each side of the arch, in front of the last border
  fb.zb = -1386; horse(fb, -XE - 66, 0.92, 1, lot.horse[0], lot.horse[1], 0.4);
  await ctx.yield();
  fb.zb = -1384; horse(fb, -XE + 62, 0.86, 1, lot.horse2[0], lot.horse2[1], 2.6);
  await ctx.yield();
  addFlat(grp, fb, null, 'far-shore');
  await ctx.yield();
  const LW = ['terracotta', 'gold', 'bluegreen'], hh = (i, k) => { const q = Math.sin(i*127.1 + k*311.7)*43758.5453; return q - Math.floor(q); };
  const loose = (i, x, y, len, o = {}) => ({ x, y, z: o.z ?? 0.9, len, wool: LW[(i + Math.floor(3*hh(i, 5))) % 3], lean: -0.04 + 0.06*hh(i, 7), phase: hh(i, 9), width: (o.w ?? 0.46) + 0.24*hh(i, 11) });
  // the one half-worked thing: a knot tree on the last lower border beside the arch, as tall as the horses; its port
  // boughs are laid in wool, its starboard boughs and strand drawn in a bold dark line, with the wool still hanging from them
  const AX = -XE, treeEnds = [];
  {
    const tb = new FlatBuilder(); tb.zb = -1399.4;
    knotTree(tb, AX + 53, 45, lot.lead.slice(0, 4), rng, { half: true, y: 14, ends: treeEnds });
    addFlat(grp, tb, style.wool({ ride: 0 }), 'half-worked-tree');
    await ctx.yield();
  }
  // free wool at the arch: long ends from both corners of the eaves, hanging beside the columns on bare linen (never
  // across the arch's face), and the ends left on the half-worked tree
  {
    const th = [], K = ARCH_K, ry = 14 + (11 + 13.6 + 1.4)*K, n = Math.round(26*detail);
    for (let i = 0; i < n; i++) th.push(loose(i, AX + (i % 2 ? 1 : -1)*(15.4 + 2.8*hh(i, 41))*K, ry + 0.3, 12 + 16*hh(i, 43), { w: 0.55 }));
    treeEnds.forEach(([x, y], i) => th.push(loose(i + 70, x, y, Math.min(y - 15, 7 + 10*hh(i, 47)), { z: 1.4 })));
    const m = new THREE.Mesh(makeFringe(th, 10), style.thread()); m.name = 'loose-ends-arch'; m.frustumCulled = false; m.position.z = -1400; grp.add(m);
    await ctx.yield();
  }
  // free wool on the landing rank: long ends from the yard-arms, the prow beasts and the stern posts
  if (S.drawn) {
    const th = [];
    S.drawn.xs.forEach((x0, j) => shipEnds(th, x0, S.drawn.s, 60 + j*5, detail));
    const m = new THREE.Mesh(makeFringe(th, 10), style.thread({ ride: 1 })); m.name = 'loose-ends-landing'; m.frustumCulled = false; S.drawn.g.add(m);
    await ctx.yield();
  }
  // raw warp ends below the hem of the last span, in raw linen (one tone, as they always were), streaming in the draught
  const LIN = ['#BDB08F', '#BDB08F', '#BDB08F'];
  {
    const th = [], n = Math.round(420*detail);
    for (let i = 0; i < n; i++) {
      const x = -XE - 400 + 800*(i + rng())/n;
      th.push({ x, y: 68.4, z: 0.2, len: rng.range(7, 15), wool: LIN[i % 3], lean: rng.range(-0.05, 0.03), phase: rng(), width: rng.range(0.2, 0.34) });
    }
    const warp = new THREE.Mesh(makeFringe(th, 6), style.thread({ hung: [108, 38] })); warp.position.z = -1420; warp.frustumCulled = false; warp.name = 'warp-ends'; grp.add(warp);
    await ctx.yield();
  }
  // the cloth ends frayed at z 1,430: beyond the arch the floor cloth's own warp runs on as free ends, tens of metres
  // long, lifted off the floor by the draught and streaming, in locks, above the last border
  {
    const th = [], n = Math.round(230*detail);
    for (let i = 0; i < n; i++) {
      const lock = Math.floor(i/5), x = AX - 380 + 760*(lock + 0.5)/(n/5) + (hh(lock, 61) - 0.5)*9 + (i % 5 - 2)*(1.1 + 1.4*hh(i, 63));
      th.push({ x, y: 0, z: 0, len: (30 + 26*hh(lock, 65))*(0.8 + 0.3*hh(i, 67)), wool: LIN[(i + lock) % 3], lean: (hh(lock, 69) - 0.5)*0.1, phase: hh(lock, 71) + 0.08*hh(i, 73), width: 0.42 + 0.3*hh(i, 75) });
    }
    const fray = new THREE.Mesh(makeFringe(th, 11), style.thread()); fray.name = 'frayed-warp'; fray.frustumCulled = false;
    fray.rotation.x = Math.PI - 0.42; fray.position.set(0, 1, -1431); grp.add(fray);
  }
  return { update() {} };
}
