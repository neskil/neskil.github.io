// WHERE THE SEA TURNS SQUARE
// Neo-plastic painting carried into three dimensions. A white North Sea of black dashes that change from crosswise
// to lengthwise marks in bands; a grey shore, the only place a curve is allowed; the Tree, which straightens bough
// by bough into a lattice of black bars and coloured panes as our lift cage rises through it; and beyond it a city
// of floating white, red, yellow and blue planes on yellow avenues, run to a syncopated beat. One diagonal in the
// whole world: the exit, a square frame hung on its point.
//
// Everything visible is made from ONE makeStyle instance (src/parts/sea-turns-square.js): unlit flat paint, axis
// boxes, flat strips. No light, no fog, no texture, no full-screen pass. World frame: course -Z, +X right, sea y 0.
// The gaze is always level and along the route's heading (two pois that cancel the engine's own pitch in both the
// sweeping and the steady camera), so the lifts are lifts. All that rides with us is a small lift plate (one short
// bar, yellow ends, a red square), never upright bars over the view: it comes up into the bottom of the frame as each
// lift starts and sinks out of it as we level off; over the sea and on the avenues the bottom of the frame is the world's. The paints are flat inks
// (post.flat 1: no tone map), so every colour on screen is its palette hex.
// The first lift starts over the last of the sea (z -262); the shore line is at z -310. The first standing lattice draws itself in while the eye is on the landing and the second flight; everything else behind the Tree
// as seen from the sea (item.wedge) is left out through the whole rise, and the city to its left (item.left) is
// drawn shut for the rise, so the Tree is squared alone on white: curved boughs above, and below the eye line ONE
// bold standing lattice (THE STANDING GRID) drawn bar by bar and pane by pane as we rise. The city
// arrives ring by ring as we level off into THE COMPOSITION: a few large planes of red, blue and yellow with black
// bars at different depths, one high on the left, one overhead, one low on the right, one closing the avenue.
// The pier is ruled out to meet us over the first seconds (the entry is the Tree alone across the dashed sea). The
// rise goes THROUGH the Tree: five near boughs, 20 m from the lift line and square to the gaze, are squared as we
// pass them (curve above the eye line, stair of bars below, a pane drawn into a step). THE SECOND COMPOSITION (three
// planes with a thick bar each, seen from the second lift) and THE GATE (two big planes the last avenue is first
// seen between) hold the end of the flight. Seaward of the cross avenue the sea is drawn in elevation: its marks
// stand square to the view in rows, level strokes turning to plus signs and uprights band by band, all black.
// THE OPENING IS FOUR PICTURES (the flown line, CP): the Tree across the dashed sea between large planes of paint
// that stand on the white plain at different depths (colour from the first frame; the pale block city behind the
// Tree); a dip to 3.1 m among plus signs at arm's length, the pier whole at middle distance (24 m off the line, never
// a pile at the lens); back to 5 m while the plus signs step up into the air ahead of us (each lifts off when the lens comes within reach of it); then a first short lift to 28 m,
// so the shore is crossed looking down on surf, dune band, marram strokes and the first ruled lines, level with the
// lowest boughs. The lift proper is then flown in two flights with a level landing at 78 m, 90 m short of the trunk,
// from which the Tree is one picture: black trunk bars ending at the fork, curved boughs above the eye line.
// THE DRAWER'S RULE (in space, style item.near): every plane of paint of the city whose larger side is 16 m or more (and the opening's two far planes) begins to draw
// shut into one edge when the lens comes within 2.6 times that side, has clicked shut at 1.8 times and opens again
// behind us; THE CLEARANCE: every bar, column and shaft of the city stands 15 m (thin) to 42 m (thick, or a shaft) from the
// flown line or is moved straight away from it until it does; THE STANDING LATTICES: four tall lattices of black bars
// and panes at the far ends of the avenues we fly, each drawn in bar by bar while the eye flies the stretch of the course before its avenue, and whole as the eye passes the corner where its avenue begins.
// The third near bough is built large, 46 m ahead of the lift: ONE limb whole in the
// frame, a stair of two steps with panes below the eye line and the same limb as a curve above it.
// TWO WEIGHTS ON SCREEN: every bar kept is the thick one or is held at about 3.5 px (item.bold); the rest are left
// out, with the far avenues that lay edge-on to our levels. Nothing lies lengthwise to the view from the cross
// avenue (ground lines are ruled out again before the turn, item.undo). ONE TREE: four of the standing grid's uprights
// go on above its top rail as thick curved boughs (painted out just before plane A is drawn). THE TURNS ARE COMPOSED:
// the square beside the first turn is 30 by 26 m and is drawn shut as we come up to it, the cross avenue and the
// last one are ruled as we come to the turn (item.late for their crowds), the overhead plane is drawn after it. THE
// SECOND LIFT looks at one strip whole in the frame, three large planes and a calm white ground (CALM BELOW THE SECOND
// LIFT). PLUS AND MINUS: where the thinning law is full (within 67 m of a lens 5 m up) every cell of the sea's lattice carries a mark, one in three a plus sign for most of a swell, at every height of the lens up to 75 m (from 85 m up there are no marks under it; in the dip, 3.1 m, they are at arm's length); a mark is 1 m broad. The cross avenue runs through a colonnade
// of shaft strips with one plane of paint seen whole through its opening. The exit is a square on its point with a second square ruled round it as we come down the last avenue.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/sea-turns-square.js';

const TREE = [-27, 6, -345];            // trunk base (the city shares the Tree's 6 m lattice: x = -27 + 6i, y = 6 + 6j)
const Y_SEA = 5, Y_AVE = 114, Y_TOP = 162, LIFT = 65 * Math.PI / 180, Z_LIFT = -262, TILT = 0.06, SHORE = -310, Z_START = 3.63;   // the lift starts over the last of the sea, so the shore is crossed looking at the Tree, not at the sand

// a polyline of corners with a fillet radius at each inner corner -> points for makePath (straights are sampled
// every ~22 m so the spline stays straight, arcs every ~12 degrees)
function filletPath(corners, radii) {
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]), pts = [], n = corners.length;
  const pushLine = (a, b) => {
    const L = a.distanceTo(b), m = Math.max(1, Math.round(L / 22));
    for (let i = (pts.length ? 1 : 0); i <= m; i++) pts.push(a.clone().lerp(b, i / m));
  };
  let from = V(corners[0]);
  for (let i = 1; i < n - 1; i++) {
    const B = V(corners[i]), d1 = B.clone().sub(V(corners[i - 1])).normalize(), d2 = V(corners[i + 1]).sub(B).normalize();
    const th = Math.acos(Math.min(1, Math.max(-1, d1.dot(d2)))), R = radii[i] || 14, t = R * Math.tan(th / 2);
    const s = B.clone().addScaledVector(d1, -t), e = B.clone().addScaledVector(d2, t);
    const nrm = d2.clone().addScaledVector(d1, -d1.dot(d2)).normalize(), c = s.clone().addScaledVector(nrm, R);
    pushLine(from, s);
    const steps = Math.max(3, Math.round(th / 0.2));
    for (let k = 1; k <= steps; k++) {
      const a = th * k / steps;
      pts.push(c.clone().addScaledVector(nrm, -R * Math.cos(a)).addScaledVector(d1, R * Math.sin(a)));
    }
    from = e;
  }
  pushLine(from, V(corners[n - 1]));
  return pts;
}
function segDist(px, py, pz, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz;
  let t = l2 > 0 ? ((px - a[0]) * dx + (py - a[1]) * dy + (pz - a[2]) * dz) / l2 : 0; t = Math.min(1, Math.max(0, t));
  return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t, pz - a[2] - dz * t);
}

export default {
  id: 'sea-turns-square',
  name: 'Where the Sea Turns Square',
  category: 'bizarre',
  after: 'Piet Mondrian, 1872 to 1944',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, Q = ctx.quality || { detail: 1 }, detail = Q.detail ?? 1;
    const density = vary.density ?? 1, scene = new THREE.Scene();

    // ---------------------------------------------------------------- the seeded look (all draws up front, fixed order)
    const rv = rng.fork ? rng.fork('look') : rng;
    const r0 = rv(), r1 = rv(), r2 = rv(), r3 = rv(), r4 = rv(), r5 = rv(), r6 = rv();
    const hour = vary.hour || 'any';
    const key = hour === 'night' ? 'night' : (hour === 'golden' || hour === 'dawn') ? 'evening' : hour === 'day' ? 'noon'
      : (r0 >= 0.84 ? 'night' : (r0 >= 0.27 && r0 < 0.53 ? 'evening' : 'noon'));
    const seaState = r1 < 0.4 ? 'calm' : (r1 < 0.75 ? 'fresh' : 'fog');
    const season = r2 < 0.5 ? 'blossom' : (r2 < 0.72 ? 'bare' : 'fruit');
    const colourway = r3 < 0.45 ? 'balanced' : (r3 < 0.7 ? 'white' : 'yellow');
    const quick = r4 < 0.5, herons = r5 < 0.3, secondCage = r6 < 0.5, rare = !!vary.rare;
    const night = key === 'night', evening = key === 'evening';

    // ---------------------------------------------------------------- the paints, by role
    await ctx.yield();
    const style = makeStyle(ctx, { exposure: 1, flat: true });   // flat inks: post.flat skips the tone map, so every paint is its hex
    await ctx.yield();
    const pal = style.pal, palA = style.palA, shown = style.shown, U = style.U;
    const day = { black: pal.black.clone(), w0: pal.whiteWarm.clone(), w1: pal.whiteCool.clone(), w2: pal.whiteBright.clone() };
    if (night) {
      // the ground of everything is black (three unequal blacks), the lines are yellow, the sea's dashes white
      const k = (v, t) => shown(new THREE.Color().setRGB(v * t[0], v * t[1], v * t[2], THREE.LinearSRGBColorSpace));
      pal.whiteWarm.copy(k(0.0085, [1.05, 1, 0.92])); pal.whiteCool.copy(k(0.0055, [0.92, 1, 1.12])); pal.whiteBright.copy(k(0.014, [1, 1, 1]));
      pal.black.copy(pal.yellow);
      U.uGrey1.value = shown(palA.yellow.clone().multiplyScalar(0.62)); U.uGrey2.value = shown(palA.yellow.clone().multiplyScalar(0.36)); U.uGrey3.value = shown(palA.yellow.clone().multiplyScalar(0.2));
      pal.grey.copy(k(0.05, [0.95, 1, 1.05])); pal.grey2.copy(k(0.09, [0.95, 1, 1.05]));
      palA.grey.setRGB(0.05 * 0.95, 0.05, 0.05 * 1.05, THREE.LinearSRGBColorSpace);
    }
    U.uBeat.value = quick ? 0.38 : 0.56;
    const P = {
      sea: pal.whiteWarm, sky: pal.whiteCool, bright: pal.whiteBright, line: pal.black, red: pal.red, yellow: pal.yellow, blue: pal.blue,
      grey: pal.grey, dash: night ? day.w2 : pal.black, shore: evening ? pal.blue : pal.grey, cap: night ? pal.red : pal.yellow,
      lines: night ? [pal.yellow, pal.yellow, pal.red, pal.blue, pal.yellow] : [pal.black],
    };
    const lineC = (r) => P.lines[Math.floor(r * P.lines.length) % P.lines.length];

    // ---------------------------------------------------------------- the route: only straights and right angles
    const dzl = (Y_AVE - Y_SEA) / Math.tan(LIFT), dxl = (Y_TOP - Y_AVE) / Math.tan(LIFT);
    const C = [[0, Y_SEA, 0], [0, Y_SEA, Z_LIFT], [0, Y_AVE, Z_LIFT - dzl], [0, Y_AVE, -476], [116, Y_AVE, -476],
      [116 + dxl, Y_TOP, -476], [168, Y_TOP, -476], [168, Y_TOP, -652]];
    // THE FLOWN LINE. C is the course everything is laid out round; the line actually flown differs from it only over
    // the sea, so that the opening is four pictures and not one: it dips to 3.1 m among the marks and the pier's piles,
    // comes back to 5 m while the plus signs step up ahead, then a first short lift (65 degrees, like the
    // others) takes it up to Y_MID so that the shore is crossed looking down on the surf, the dune band and the first
    // ruled lines, level with the lowest boughs; it joins the first lift's own line there. Same length as C, so every
    // later moment keeps its u.
    // THE TREE FROM A LANDING (u 0.32 to 0.38). The first lift proper is flown in two flights with a level landing at
    // Y_LAND between them, 60 to 110 m short of the trunk: from there the Tree is the picture, its five black trunk bars
    // ending at the fork inside the frame and going on above the eye line as curved boughs. (Before, the lift rose
    // 26 m from the trunk and its bars stood from the bottom of the frame to the top like a fence at the lens.) The
    // second flight is the old lift's own line from Y_LAND up, so the crown is entered exactly as before.
    const Y_DIP = 3.1, Y_MID = 28, Z_UP = -186, tl = Math.tan(LIFT), Y_LAND = 78, Z_UP2 = -212;
    const CP = [[0, Y_SEA, Z_START], [0, Y_SEA, -30], [0, Y_DIP, -56], [0, Y_DIP, -96], [0, Y_SEA, -124], [0, Y_SEA, Z_UP], [0, Y_MID, Z_UP - (Y_MID - Y_SEA) / tl], [0, Y_MID, Z_UP2], [0, Y_LAND, Z_UP2 - (Y_LAND - Y_MID) / tl], [0, Y_LAND, Z_LIFT - (Y_LAND - Y_SEA) / tl], ...C.slice(2)];
    const pathPts = filletPath(CP, [0, 30, 30, 30, 30, 14, 14, 14, 14, 14, 14, 16, 14, 12, 16, 0]);
    await ctx.yield();
    const path = makePath(pathPts);
    const distPath = (x, y, z) => { let d = 1e9; for (let i = 0; i + 1 < C.length; i++) d = Math.min(d, segDist(x, y, z, C[i], C[i + 1])); return d; };
    const uOfDist = (d) => d / path.length;
    const dLift0 = -Z_LIFT, dLift1 = dLift0 + (Y_AVE - Y_SEA) / Math.sin(LIFT);          // rough arc lengths of the beats
    // after the level-off the Tree's front runs on with u, so anything keyed to it (style.boxes item.key) is drawn
    // out of one edge as we reach a given u: the standing grid at the level-off, the sleepers over the last avenue
    const frontOfU = (u) => 112 + (u - uOfDist(dLift1 - 6)) / 0.11 * 190;
    await ctx.yield();

    // ---------------------------------------------------------------- sky and sea: one white against another
    const sky = style.sky(); scene.add(sky);
    const flatDS = (c) => style.flat(c, { side: THREE.DoubleSide });
    const seaPlane = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), style.flat(P.sea));
    seaPlane.rotation.x = -Math.PI / 2; seaPlane.position.set(0, -1.3, -600); scene.add(seaPlane);

    // The dashes. A world-anchored lattice wrapped round the camera by modulo, in three windows of 5, 10 and 20 m
    // cells; each dash is two quads, a crosswise bar and a lengthwise bar, 1 m broad (round plus and minus: at 0.6 m
    // the sea under a level gaze was hairlines on a blank white floor). A dash never rotates: when the crest of a
    // swell reaches it the lengthwise bar grows (a plus sign rides the crest), the crosswise bar shrinks to a square (1 by 1 m),
    // and later the mark goes back the other way through a square. One change each way per swell, coherent bands.
    const fresh = seaState === 'fresh', fog = seaState === 'fog', farK = fog ? 0.47 : 1;
    U.uFarK.value = farK;
    const SW = { lambda: fresh ? 42 : 70, speed: 8, height: fresh ? 2.1 : 1.5, duty: fresh ? 0.46 : 0.24, hold: fresh ? 1.5 : 0.55, surf: 26 };
    const dg = (k) => (night ? { value: shown(palA.whiteBright.clone().multiplyScalar(k)) } : null);
    const dashU = { uTime: U.uTime, uCol: { value: P.dash }, uG1: dg(0.45) || U.uGrey1, uG2: dg(0.2) || U.uGrey2, uG3: dg(0.08) || U.uGrey3, uFarK: U.uFarK, uSeaHi: { value: 0 },
      uSwell: { value: new THREE.Vector4(SW.lambda, SW.speed, SW.height, SW.duty) }, uHold: { value: SW.hold }, uSurf: { value: SW.surf } };
    const dashVS = /* glsl */`
      attribute float aBar; attribute vec2 iCell;
      uniform float uTime, uCellSize, uBase, uHold, uSurf, uFarK, uSeaHi; uniform vec2 uRange; uniform vec4 uSwell;
      uniform vec3 uCol, uG1, uG2, uG3; varying vec3 vCol;
      ${style.glsl.ease}
      float h21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      void main(){
        // SEEN FROM THE AVENUES (hi): the sea is looked at across, from high up and 300 m off, so its marks are drawn
        // in elevation: the same marks in the same bands, but standing square to the view on a regular lattice (rows
        // 40 m apart, a mark every 60 m), each a level stroke that becomes a plus sign on the crest and an upright
        // stroke behind it. All black out to 640 m and none beyond; nothing lengthwise to the view, nothing grey.
        float hi = step(.4, uSeaHi);
        vec2 id = floor(cameraPosition.xz / uCellSize + .5) + iCell;
        float h1 = h21(id), h2 = h21(id + 17.3), h3 = h21(id + 41.7);
        vec2 xz = (id + (vec2(h1, h2) - .5) * .5 * (1. - hi)) * uCellSize;
        float d = distance(xz, cameraPosition.xz), hc = clamp(abs(cameraPosition.y), 3., 14.);
        float S = 1. + 3.4 * uSeaHi;                                  // seen from the avenues: marks three times the size, a fifth as many
        float keep = clamp(900. * hc / max(d * d, 1.), 0., 1.) / uBase / (S * 1.5);
        float rmax = mix(700. * uFarK * max(clamp((85. - abs(cameraPosition.y)) / 65., 0., 1.), uSeaHi), 640., hi);   // from the avenues the sea keeps its marks out to a clear distance (uSeaHi), bolder   // seen from the lift and the avenues the far marks are left out, ring by ring
        float keepHi = step(mod(id.x, 40. / uCellSize), .5) * step(mod(id.y, 60. / uCellSize), .5);
        // PLUS AND MINUS: the thinning law shows the cells whose draw is at most 1.5 keep (live: keep), so where it
        // is full (within 67 m of a lens 5 m up) every cell carries a mark, and further out one more for every two
        // (with the lens at the sea's level the three windows still meet without a step). A mark's KIND is its
        // cell's own draw and never changes: two cells in three are the strokes that change once each way per
        // swell; the third (extra: draw over two thirds, in the 5 m window only (uBase 1), the cells live never
        // showed there but in the dip) hold the crest's plus sign: each is a plus for most of a swell and a crosswise
        // stroke just before the next crest. Being the high draws they are the first the thinning leaves out (lens
        // 5 m up: none beyond 82 m). Every mark of the 10 m and 20 m windows is a stroke, and every mark live shows
        // keeps live's kind. From the avenues (hi) the sea is its rows in elevation, as before, with none of them.
        float extra = step(.6667, h3 * uBase) * (1. - hi);
        float show = step(uRange.x, d) * step(d, min(uRange.y, rmax)) * mix(step(h3, 1.5 * keep), keepHi, hi) * step(${(SHORE + 4).toFixed(1)}, xz.y) * step(abs(xz.x), 1500.);
        float period = uSwell.x / uSwell.y, f = fract((xz.y + uSwell.y * uTime) / uSwell.x + (h3 - .5) * .05), ts = f * period, tOff = uSwell.w * period;
        float y = .5 * uSwell.z * cos(6.2832 * f);
        float zLen = 1. + 2. * sqEase(ts / .4) - 2. * sqEase((ts - tOff) / .4);                  // (a mark is 1 m broad and 3 m long: its square is 1 by 1)
        float xLen = 3. - 2. * sqEase((ts - uHold - .4) / .4) + 2. * sqEase((ts - tOff - .45) / .4);
        if (extra > .5) { xLen = 3.; zLen = 1. + 2. * sqEase(ts / .4) - 2. * sqEase((ts - .82 * period) / .4); }
        float surf = step(xz.y, ${(SHORE + 4).toFixed(1)} + uSurf);                        // the last swell stands its marks upright as surf
        float m = .0014 * d * (1. + 1.3 * uSeaHi);                                           // half of the smallest size a mark may have
        vec3 p = vec3(xz.x, y, xz.y);
        if (hi > .5) {
          float dS = distance(p, cameraPosition), Lz = max(14., .036 * dS), Hb = max(2.2, .0075 * dS);
          float la = max(Lz * (1.2 * xLen - .6) / 3., Hb), lb = max(Lz * (1.2 * zLen - .6) / 3., Hb), yc = .5 * lb;   // (the rows in elevation keep their sizes: 0.6 to 3)
          if (aBar < .5) { p.z += position.x * la; p.y += yc + position.y * Hb; }
          else { p.z += position.x * Hb; p.y += yc + position.y * lb; }
        } else if (aBar < .5) {
          p.x += position.x * max(xLen * S, 2. * m); p.z += position.y * S;
          p.y += sign(position.y) * max(0., m - .5 * hc / max(d, 1.));
        } else if (surf > .5) {
          p.x += position.x * max(1., 2. * m); p.y += (position.y + .5) * (1.9 + (zLen - 1.) * 1.2);
        } else {
          p.x += position.x * max(S, 2. * m); p.z += position.y * zLen * S;
          p.y += sign(position.y) * max(0., m - .5 * zLen * hc / max(d, 1.)) * step(1.1, zLen);
        }
        float dd = d / uFarK / (1. + 1.2 * uSeaHi);                    // (from above the marks stay black further out)
        vCol = hi > .5 ? uCol : (dd > 500. ? uG3 : (dd > 320. ? uG2 : (dd > 190. ? uG1 : uCol)));
        gl_Position = show > .5 ? projectionMatrix * viewMatrix * vec4(p, 1.) : vec4(2., 2., 2., 1.);
      }`;
    const dashFS = 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }';
    const dashGeo = (n, half) => {
      const g = new THREE.InstancedBufferGeometry(), q = [-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0];
      g.setAttribute('position', new THREE.Float32BufferAttribute([...q, ...q], 3));
      g.setAttribute('aBar', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1], 1));
      g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      const cells = new Float32Array(n * n * 2); let k = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { cells[k++] = i - half; cells[k++] = j - half; }
      g.setAttribute('iCell', new THREE.InstancedBufferAttribute(cells, 2)); g.instanceCount = n * n; return g;
    };
    const dn = Math.max(40, Math.round(66 * Math.sqrt(detail)) & ~1);
    for (const w of [{ cell: 5, r: [0, 150], base: 1 }, { cell: 10, r: [150, 330], base: 0.25 }, { cell: 20, r: [330, 720], base: 0.0625 }]) {
      const n = Math.min(dn + 8, Math.ceil(w.r[1] / w.cell) * 2 + 2) & ~1;
      const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: dashVS, fragmentShader: dashFS,
        uniforms: { ...dashU, uCellSize: { value: w.cell }, uBase: { value: w.base }, uRange: { value: new THREE.Vector2(w.r[0], Math.min(w.r[1], n * 0.5 * w.cell)) } } });
      const mesh = new THREE.Mesh(dashGeo(n, n / 2), mat); mesh.frustumCulled = false; scene.add(mesh);
      await ctx.yield();
    }

    // ---------------------------------------------------------------- the shore: three overlapping grey curves
    const rs = rng.fork ? rng.fork('shore') : rng, dph = [rs.range(0, 6), rs.range(0, 6), rs.range(0, 6), rs.range(0, 6), rs.range(0, 6), rs.range(0, 6)];
    const gap = (x) => { const t = Math.min(1, Math.max(0, (Math.abs(x - 2) - 9) / 46)); return t * t * (3 - 2 * t); };
    const duneH = [
      (x) => (1.5 + 0.8 * Math.sin(x * 0.011 + dph[0]) + 0.4 * Math.sin(x * 0.031 + dph[1])) * (0.3 + 0.7 * gap(x)),
      (x) => 3.5 + 1.0 * Math.sin(x * 0.0083 + dph[2]) + 0.5 * Math.sin(x * 0.023 + dph[3]),
      (x) => 5.5 + 0.8 * Math.sin(x * 0.0061 + dph[4]) + 0.4 * Math.sin(x * 0.019 + dph[5]),
    ];
    const duneZ = [SHORE, SHORE - 18, SHORE - 40, -361];     // a narrow band: from the lift it is a tenth of the frame, not a fifth
    const shoreTones = evening ? [1.0, 1.0, 1.0] : [1.0, 1.24, 0.8];   // (at evening the dune is the one blue: its three curves read by their outlines against the white)
    const duneMat = [], duneCol = [];
    for (let i = 0; i < 3; i++) {
      const pos = [], idx = [], n = 300;
      for (let k = 0; k <= n; k++) {
        const x = -1800 + 3600 * k / n, h = duneH[i](x);
        pos.push(x, -1.4, duneZ[i], x, h, duneZ[i], x, h, duneZ[i + 1] - (i < 2 ? 2 : 0));
        if (k < n) { const a = k * 3; idx.push(a, a + 3, a + 4, a, a + 4, a + 1, a + 1, a + 4, a + 5, a + 1, a + 5, a + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, flatDS(shown((evening ? palA.blue : palA.grey).clone().multiplyScalar(shoreTones[i])))); m.frustumCulled = false; scene.add(m); duneMat.push(m.material); duneCol.push(m.material.uniforms.uCol.value.clone());
    }
    const duneAt = (x, z) => (z > duneZ[1] ? duneH[0](x) : (z > duneZ[2] ? duneH[1](x) : duneH[2](x)));
    await ctx.yield();

    // marram: short grey curved ticks leaning with the wind; a wave running inland just ahead of us stands each one
    // up into a vertical dash of the line colour
    const nTuft = Math.round(3000 * detail * Math.min(1.15, density)), tp = new Float32Array(nTuft * 4), tr = new Float32Array(nTuft * 2);
    for (let i = 0; i < nTuft; i++) {
      let x = rs.gauss() * 95 + rs.range(-40, 40); const z = rs.range(duneZ[0] - 1.5, duneZ[3] + 4);
      if (Math.abs(x) < 7) x = (x < 0 ? -1 : 1) * (7 + Math.abs(x));
      tp[i * 4] = x; tp[i * 4 + 1] = duneAt(x, z); tp[i * 4 + 2] = z; tp[i * 4 + 3] = rs.range(1.0, 1.9);
      tr[i * 2] = rs(); tr[i * 2 + 1] = rs.range(0.5, 1.2) * (rs.chance(0.8) ? 1 : -0.6);
    }
    const tg = new THREE.InstancedBufferGeometry(), tv = [], ti = [], TS = 4;
    for (let k = 0; k <= TS; k++) { tv.push(-0.5, k / TS, 0, 0.5, k / TS, 0); if (k < TS) { const a = k * 2; ti.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
    tg.setAttribute('position', new THREE.Float32BufferAttribute(tv, 3)); tg.setIndex(ti);
    tg.setAttribute('iP', new THREE.InstancedBufferAttribute(tp, 4)); tg.setAttribute('iR', new THREE.InstancedBufferAttribute(tr, 2)); tg.instanceCount = nTuft;
    const shoreU = { uTime: U.uTime, uWave: { value: 1e4 }, uGrey: { value: night ? pal.grey2 : pal.grey2 }, uLine: { value: P.line } };
    const tuftMat = new THREE.ShaderMaterial({ uniforms: shoreU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 iP; attribute vec2 iR; uniform float uTime, uWave; uniform vec3 uGrey, uLine; varying vec3 vCol;
        ${style.glsl.ease}
        void main(){
          float k = sqBack((iP.z - uWave) / 5. + iR.x * .6), t = position.y;
          // a tuft is a short bold stroke at any distance (never a speck): it keeps a width and a height on the
          // canvas, and far tufts are left out, more of them the farther off
          float d = distance(iP.xyz, cameraPosition), w = max(.2, .0065 * d), tall = clamp(d / 62., 1., 2.3);
          float show = step(fract(iR.x * 13.7), min(1., 4200. / max(d * d, 1.)));
          float stay = step(fract(iR.x * 7.31), .08); w = mix(w, max(.6, .0065 * d) * stay, k) * show;          // stood up, one tuft in five stays, as a dash
          float lean = (iR.y + .28 * sin(uTime * 1.9 + iP.x * .09 + iR.x * 6.)) * (1. - k);
          vec3 p = iP.xyz + vec3(lean * t * t * iP.w * tall * .8 + position.x * w * mix(1. - .6 * t, 1., k), t * iP.w * tall * mix(1. - .22 * abs(lean), 2.1, k) * show, 0.);
          vCol = k > .5 ? uLine : uGrey;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }' });
    const tufts = new THREE.Mesh(tg, tuftMat); tufts.frustumCulled = false; scene.add(tufts);
    await ctx.yield();

    // ---------------------------------------------------------------- the hero: the Tree
    // what the composition is looked at from (the top of the lift and the level leg) and its planes A, B, D and the
    // diamond, in the Tree's local frame: nothing of the squared Tree stands between them (opts.sight)
    const eyes = [[0, 100, -306], [0, 104, -308], [0, 108, -310], [0, 111, -311.5]]; for (let z = -313; z > -446; z -= 3) eyes.push([0, Y_AVE, z]);
    const sightOf = (x0, y0, x1, y1, z) => ({ rect: [x0 - TREE[0], y0 - TREE[1], x1 - TREE[0], y1 - TREE[1], z - TREE[2]], eyes: eyes.map((e) => [e[0] - TREE[0], e[1] - TREE[1], e[2] - TREE[2]]) });
    const treeSight = [sightOf(-70, 122, -16, 176, -420.6), sightOf(13, 70, 61, 112, -462.4), sightOf(-70, 116, -6, 170, -534.8), sightOf(148, 142, 188, 182, -650), sightOf(-66, 58, -12, 110, -405)];
    const hero = await buildHero(ctx, { style, sight: treeSight, petal: night ? day.w2 : undefined, petalSquare: night && season !== 'fruit' ? day.w2 : undefined, detail: detail * (season === 'bare' ? 0.06 : 1), clear: 8.5, tilt: TILT, paneLag: 10, keepOut: [[[-96, 38, -122], [16, 106, 5]]], noStair: [[[55, 72, -130], [200, 108, 20]]],   // (noStair: right of the one large limb, at its height, the Tree rules no bar of its own: the limb in the act stands against white)
      corridor: C.slice(0, 6).map((p) => [p[0] - TREE[0], p[1] - TREE[1], p[2] - TREE[2]]),
      flown: (() => { const o = [], q = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 1) { path.posAtDist(d, q); o.push([q.x - TREE[0], q.y - TREE[1], q.z - TREE[2]]); } return o; })(),   // (the line as flown at every metre of the course: the Tree keeps its gulls off it)
      season, herons, evening });
    hero.object.position.set(TREE[0], TREE[1], TREE[2]); scene.add(hero.object);
    await ctx.yield();

    // every static bar, post, plane and square of the world goes into one list and becomes one draw call
    const items = [];
    const bar = (a, b, w, c, o) => { const it = style.bar(a, b, w, c, o); items.push(it); return it; };

    // ---------------------------------------------------------------- the pier and the breakwaters
    const rp = rng.fork ? rng.fork('pier') : rng;
    // THE PIER IS RULED OUT TO MEET US. From the entry it is a short far stroke at the shore, and the Tree stands
    // alone across the dashed sea; then its five bars are ruled seaward toward us, the posts standing up pair by pair
    // as the head passes them, and it reaches us as we come alongside its head. One mesh; only its attribute data moves.
    const PX = 16;                                                  // the pier stands off to the right at middle distance (24 m from the line): no pile is ever against the lens or cut by the frame edge
    const pierItems = [], pbar = (a, b, w, c) => { const it = style.bar(a, b, w, c, { ext: 0 }); pierItems.push(it); return it; };
    for (let k = 0; k < 5; k++) {                                   // five parallel bars, none ending where its neighbour does
      const x = 9.6 + PX + k * 1.75, z0 = -56 + rp.range(-9, 9), z1 = SHORE - 17 - rp.range(-6, 8);
      for (let n = Math.ceil((z0 - z1) / 20), j = 0; j < n; j++) pbar([x, 3.4, z0 + (z1 - z0) * j / n], [x, 3.4, z0 + (z1 - z0) * (j + 1) / n], 0.6, lineC(k * 0.21)).bold = true;   // (bold: from the first lift the deck was five hairlines)
    }
    for (let k = 0; k < 22; k++) {                                  // pairs of posts, two a second at our speed
      const z = -59 - k * 12.5, h = 6.2 + rp.range(-0.5, 1.4);
      pbar([8.5 + PX, -1.3, z], [8.5 + PX, h + (k === 2 ? 2.6 : 0), z], k === 2 ? 2.4 : 0.6, lineC(0.3 + k * 0.37));      // one pile of the thick weight at the pier's head: seen large from the dip
      pbar([18.1 + PX, -1.3, z + 0.9], [18.1 + PX, h + rp.range(-1, 1), z + 0.9], 0.6, lineC(0.7 + k * 0.37));
      if (k % 4 === 1) pbar([7.2 + PX, 5.2, z + 0.5], [19.6 + PX, 5.2, z + 0.5], 0.6, lineC(0.1)).bold = true;
    }
    for (let row = 0; row < 3; row++) {                             // three rows of posts walking out into the sea
      const x = -24 - row * 34 - rp.range(0, 8), n = 14 + row * 3;
      for (let k = 0; k < n; k++) {
        const z = SHORE + 7 + k * (7 + row * 1.5) + rp.range(-0.6, 0.6), h = Math.max(1.2, 5.6 - k * 0.32 + rp.range(-0.4, 0.4));
        bar([x + rp.range(-0.25, 0.25), -1.3, z], [x, h, z], row > 0 && k % 5 === 0 ? 2.4 : 0.6, lineC(row * 0.3 + k * 0.13), { ext: 0 });
      }
    }
    for (let k = 0; k < 9; k++) {                                     // and one row close by on the left: tall posts the shore is seen past
      const z = -237 - k * 7.6 - ((k * 0.618) % 1) * 1.6, h = 6.4 + ((k * 0.382 + 0.2) % 1) * 2.1;
      bar([-12.6 - (k % 3) * 0.35, -1.3, z], [-12.6 - (k % 3) * 0.35, h, z], k === 3 ? 2.4 : 0.6, lineC(k * 0.29), { ext: 0 });
    }
    const pier = style.boxes(pierItems); scene.add(pier);
    const pierPos = pier.geometry.attributes.iPos, pierSize = pier.geometry.attributes.iSize; pierPos.setUsage(THREE.DynamicDrawUsage); pierSize.setUsage(THREE.DynamicDrawUsage);
    let pierK = -1;
    function rulePier(u) {
      const k = Math.min(1, Math.max(0, u * path.length / (Z_START + 56))); if (k === pierK) return; pierK = k;   // by metres flown: from the entry until the lens comes alongside the pier's head (z -56)
      const zR = -205 + 172 * k, sm = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
      for (let i = 0; i < pierItems.length; i++) {
        const p = pierItems[i].p, sz = pierItems[i].s;
        if (sz[2] > sz[1] && sz[2] > sz[0]) { const zb = p[2] - sz[2] / 2, L = Math.max(0, Math.min(p[2] + sz[2] / 2, zR) - zb); pierPos.setZ(i, zb + L / 2); pierSize.setZ(i, L); }
        else { const g = sm((zR - p[2]) / 9); if (sz[1] > sz[0]) { pierPos.setY(i, p[1] - sz[1] / 2 * (1 - g)); pierSize.setY(i, sz[1] * g); } else pierSize.setX(i, sz[0] * g); }
      }
      pierPos.needsUpdate = true; pierSize.needsUpdate = true;
    }
    await ctx.yield();

    // eight plus signs rocking on the swell; they step up into the air like counters on a board as we pass.
    // ONE RULE FOR ALL EIGHT: a bird lifts off when the lens comes within BIRD_REACH metres of it (found along the
    // flown line at steps of 2.5 m), then steps on the beat, three metres along one axis at a time, up and along by
    // turns (up, outward, up, onward, or up, onward, up, outward: its own draw says which), for a number of steps
    // that is its own draw too. Its place on the water comes from its own draws; none sits nearer the line than
    // BIRD_CLR. So the one that has been longest in the air stands highest and furthest out, and the farthest still
    // sits on the water, wherever along the stretch we are: a stair of counters.
    const birdDef = [], birdItems = [], BIRD_REACH = 130, BIRD_CLR = 9;
    for (let i = 0; i < 8; i++) {
      const left = i % 3 !== 2, x0 = left ? -rp.range(6.6, 11.5) : rp.range(22, 28) - 7, z = (i >= 2 && i <= 6 ? -149 - (i - 2) * 11 : -92 - i * 23) - rp.range(0, 9);
      const x = (left ? -1 : 1) * Math.max(BIRD_CLR, Math.abs(x0));
      birdDef.push({ x, z, hops: 22 + 2 * Math.floor(rp.range(0, 10)), side: left ? -1 : 1, h: rp(), uGo: 9 });
      birdItems.push({ p: [x, 0, z], s: [3.4, 0.62, 0.62], c: P.dash }, { p: [x, 0, z], s: [0.62, 3.4, 0.62], c: P.dash });
    }
    { const q = new THREE.Vector3();
      for (let d = path.length; d >= 0; d -= 2.5) { path.posAtDist(d, q); for (const b of birdDef) if (Math.hypot(q.x - b.x, q.y - 1.2, q.z - b.z) < BIRD_REACH) b.uGo = uOfDist(d); } }
    const HOPS = [[0, 1, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]];
    // three more that stay on the water where the line dips among them: plus signs at arm's length, rocking
    for (const q of [[-6.5, -84], [-16, -92], [-11.8, -109]]) {   // (apart, at three sizes from the dip: about 11, 7 and 4 percent of the frame)
      birdDef.push({ x: q[0], z: q[1], uGo: 9, side: -1, h: 0.5, hops: 0 });
      birdItems.push({ p: [q[0], 0, q[1]], s: [3.4, 0.62, 0.62], c: P.dash }, { p: [q[0], 0, q[1]], s: [0.62, 3.4, 0.62], c: P.dash });
    }
    const birds = style.boxes(birdItems); scene.add(birds);
    const birdPos = birds.geometry.attributes.iPos; birdPos.setUsage(THREE.DynamicDrawUsage);
    const ease = (k) => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
    function moveBirds(time, u) {
      for (let i = 0; i < birdDef.length; i++) {
        const b = birdDef[i], f = (b.z + SW.speed * time) / SW.lambda; let x = b.x, y = 0.5 * SW.height * Math.cos(6.2832 * f) + 1.2, z = b.z;
        // beats of the film since it lifted off (the film runs 40 s end to end): one step to a beat, counted from its
        // own lift-off, so no two birds step quite together
        const el = Math.max(0, (u - b.uGo) * 40 / Math.max(0.05, U.uBeat.value)), n = Math.min(b.hops, Math.floor(el)), fr = el < b.hops ? ease((el - n) / 0.45) : 0, o = b.h < 0.5 ? 0 : 2;
        for (let k = 0; k <= n && k < b.hops; k++) { const hp = HOPS[(k + o) % 4], a = (k < n ? 1 : fr) * 3; x += hp[0] * a * b.side; y += hp[1] * a; z += hp[2] * a; }
        birdPos.setXYZ(i * 2, x, y, z); birdPos.setXYZ(i * 2 + 1, x, y, z);
      }
      birdPos.needsUpdate = true;
    }

    // over the shore only: a few long pale bars lying level in the sky, the memory of cloud, drifting seaward
    const cloudDef = [], cloudItems = [], nCloud = 6;
    for (let i = 0; i < nCloud; i++) {
      const d = { x: rp.range(-420, 380), y: 175 + i * 34 + rp.range(-10, 10), z0: rp.range(0, 300), len: rp.range(260, 760), t: i % 3 === 0 ? 7 : 3.2 };
      cloudDef.push(d); cloudItems.push({ p: [d.x, d.y, -300], s: [d.len, d.t, d.t], c: night ? pal.grey : (evening ? pal.whiteBright : pal.grey) });
    }
    const clouds = style.boxes(cloudItems); scene.add(clouds);
    const cloudPos = clouds.geometry.attributes.iPos, cloudSize = clouds.geometry.attributes.iSize;
    cloudPos.setUsage(THREE.DynamicDrawUsage); cloudSize.setUsage(THREE.DynamicDrawUsage);
    function moveClouds(time, u) {
      const gone = 1 - ease((u - 0.5) / 0.07);                          // over the shore only: they are drawn in before the turn (they lie along X)
      for (let i = 0; i < nCloud; i++) {
        const d = cloudDef[i], w = (d.z0 + 2 * time) % 300, edge = ease(w / 30) * ease((300 - w) / 30) * gone;
        cloudPos.setXYZ(i, d.x, d.y, -520 + w); cloudSize.setX(i, d.len * edge);
      }
      cloudPos.needsUpdate = true; cloudSize.needsUpdate = true;
    }

    // ---------------------------------------------------------------- the lift plate the world builds under the viewer
    // All that is carried with us: one short black bar with yellow ends lying low under the lens, a thinner bar over
    // it that stops short, and the red counterweight square that slides along it as we rise. Under a fifth of the
    // frame wide, nothing upright, nothing reaching a frame edge. Placed from camera.matrixWorld every frame and
    // moved against the frame in update(): it drifts, bobs, sags in the lifts, swings wide in the turns and now and
    // then drops below the edge. One object, one visible flag. (The second cage in the far shaft keeps the old bars.)
    const cage = new THREE.Group(), cageItems = [], cb = (a, b, w, c) => cageItems.push(style.bar(a, b, w, c, { ext: 0, far: false }));
    const capAt = (p, s) => cageItems.push({ p, s: [s, s, s], c: P.cap });
    // (these are the second cage's bars, seen 50 m and more away at 2.2 times this size: all of the thin bar's width there, 0.6 m; at 0.07 to 0.17 they were hairlines)
    cb([-4.9, -7, -5.4], [-4.9, 8, -5.4], 0.28, P.line); cb([4.9, -7, -5.4], [4.9, 8, -5.4], 0.28, P.line);
    cb([-4.3, -2.42, -5.0], [3.6, -2.42, -5.0], 0.28, P.line); capAt([3.6, -2.42, -5.0], 0.5); capAt([-4.3, -2.42, -5.0], 0.5);
    cb([-3.3, -0.6, -5.2], [4.45, -0.6, -5.2], 0.28, P.line); capAt([-3.3, -0.6, -5.2], 0.5);
    const plateItems = [], pb = (a, b, w, c) => plateItems.push(style.bar(a, b, w, c, { ext: 0, far: false }));
    pb([-0.78, 0, 0], [0.7, 0, 0], 0.14, P.line); plateItems.push({ p: [0.7, 0, 0], s: [0.21, 0.21, 0.21], c: P.cap }, { p: [-0.78, 0, 0], s: [0.21, 0.21, 0.21], c: P.cap });
    pb([-0.5, 0.25, -0.12], [0.86, 0.25, -0.12], 0.06, P.line); plateItems.push({ p: [-0.5, 0.25, -0.12], s: [0.13, 0.13, 0.13], c: P.cap });
    const plate = style.boxes(plateItems); cage.add(plate);
    const weight = style.boxes([{ p: [0, 0, 0], s: [0.2, 0.2, 0.08], c: P.red, edge: P.red }]); weight.position.set(-0.3, 0.25, -0.06); cage.add(weight);
    cage.matrixAutoUpdate = false; scene.add(cage);
    const plateOff = new THREE.Vector3(), camRight = new THREE.Vector3();
    const cageP = new THREE.Vector3(), cageS = new THREE.Vector3(), cageQ = new THREE.Quaternion(), ONE = new THREE.Vector3(1, 1, 1);
    await ctx.yield();

    // ---------------------------------------------------------------- the city: avenues, shuttles, planes, bars
    const rc = rng.fork ? rng.fork('city') : rng, rgd = rng.fork ? rng.fork('grid') : rng, PORTAL = C[C.length - 1], LAST = [PORTAL[0], PORTAL[1], PORTAL[2] - 40];
    const gx = (x) => TREE[0] + Math.round((x - TREE[0]) / 6) * 6, gy = (y) => TREE[1] + Math.round((y - TREE[1]) / 6) * 6, gz = (z) => TREE[2] + Math.round((z - TREE[2]) / 6) * 6;
    const busy = (colourway === 'yellow' || night ? 1.25 : (colourway === 'white' ? 0.8 : 1)) * density * detail;
    // sight lines that must stay open: from the avenue and the second lift to the diamond
    const sight = []; for (const d of [330, 420, 520, 640, 700]) { const p = path.posAtDist(d + 80, new THREE.Vector3()); sight.push([p.x, p.y, p.z]); }
    const blocked = (x, y, z, r) => {
      if (distPath(x, y, z) < r) return true;
      for (const s of sight) if (segDist(x, y, z, s, PORTAL) < 8) return true;
      if ((z > -456 && x < 128) || z > -396 || y > 160 + (-456 - z) * 0.55) return true;      // the Tree stands in open white; the city rises behind it
      if (y > Y_TOP - 5 && segDist(x, y, z, C[6], LAST) < 19) return true;   // the last avenue is kept open to the diamond
      // resting white: a wedge of open sky over the first avenue, seen from the level-off, and one over the cross avenue
      if (z < -330 && y - Y_AVE > 12 + 0.15 * (-313 - z) && Math.abs(x) < 22 + 0.2 * (-313 - z)) return true;
      if (x > 20 && x < 150 && y - Y_AVE > 22 && Math.abs(z + 476) < 20 + 0.16 * (x - 20)) return true;
      return false;
    };
    // the voids: the city stands in clusters with white between them, never an even scatter
    const voidAt = (x, y, z) => ctx.noise.n3(x / 170 + 3.1, y / 120 + 7.7, z / 170 - 1.3) < -0.12;
    // nothing lies flat just under the cage: a floor there would fill the bottom of the frame
    const underPath = (x, y, z) => { const n = path.nearestXZ(x, z); return n.dist < 17 && y < n.y - 1 && y > n.y - 60; };
    // avenues: flat yellow strips on six levels; a = axis (0 along X, 2 along Z), c = the fixed coordinate
    const AVE = [
      { a: 2, c: 0, y: Y_AVE - 6, from: -356, to: -790, w: 9, own: true },
      { a: 0, c: -476, y: Y_AVE - 6, from: -150, to: 330, w: 6.6, own: true },
      { a: 2, c: 168, y: Y_TOP - 6, from: -462, to: -638, w: 9, own: true },
      { a: 2, c: 168, y: Y_TOP - 6, from: -668, to: -900, w: 9, own: true },
    ];
    const LEVELS = [12, 60, 108, 156, 204, 252];
    for (let i = 0; i < 34; i++) {
      if (i % 6 === 5) await ctx.yield();
      const a = rc.chance(0.5) ? 0 : 2, y = LEVELS[rc.int(0, 5)], len = rc.range(170, 620), w = rc.chance(0.7) ? 9 : 6.6;
      const c = a === 0 ? gz(rc.range(-1400, -430)) : gx(rc.range(-520, 760)), mid = a === 0 ? rc.range(-300, 500) : rc.range(-1250, -520);
      const from = mid - len / 2, to = mid + len / 2; let ok = true;
      for (let t = 0; t <= 20 && ok; t++) { const v = from + (to - from) * t / 20; if (a === 0 ? blocked(v, y, c, 13) : blocked(c, y, v, 13)) ok = false; }
      for (const o of AVE) if (o.a === a && Math.abs(o.y - y) < 1 && Math.abs(o.c - c) < 40) ok = false;
      if (ok) AVE.push({ a, c, y, from, to, w, ghost: y === 108 || y === 156 || (a === 2 && c > 30 && c < 420 && to > -640) || (y <= 60 && (a === 0 ? (c < -486 && c > -900 && to > -80 && from < 340) : (c > -80 && c < 420 && to > -900 && from < -486))) || (a === 0 && Math.abs(c + 476) < 130 && to > 40 && from < 400) });   // (and the low ones under the second lift's view, and those that lay lengthwise beside the cross avenue)   // (and one that runs along Z to the right of the first avenue lay lengthwise to it and to the last one: a thin yellow diagonal, left out too)   // (an avenue 6 m under one of our two levels was a thin yellow line seen edge-on: left out, its draws kept)
    }
    await ctx.yield();
    const shuttleC = night ? [pal.red, pal.blue, day.w2, pal.red, pal.blue] : [pal.red, pal.blue, pal.black, pal.blue, pal.red, pal.blue, pal.black];   // (no white square: at the avenue's edge it read as a bite out of the yellow)
    for (const A of AVE) {
      await ctx.yield();
      const lo = Math.min(A.from, A.to), hi = Math.max(A.from, A.to), L = hi - lo, m = (lo + hi) / 2;
      for (let n = A.ghost ? 0 : Math.ceil(L / 56), j = 0; j < n; j++) { const v = hi - L * (j + 0.5) / n, it = { p: A.a === 0 ? [v, A.y - 0.2, A.c] : [A.c, A.y - 0.2, v], s: A.a === 0 ? [L / n, 0.4, A.w] : [A.w, 0.4, L / n], c: P.yellow, wedge: true, bold: !A.own };
        if (A === AVE[0]) { it.wedge = false; it.free = true; it.key = 81.2 + 0.9 * j; it.slide = [0, 0, -L / n]; }
        // THE CROSS AVENUE AND THE LAST ONE ARE RULED AS WE COME TO THE TURN. Seen from the first avenue the cross
        // avenue lay edge-on, 6 m under the eye: a yellow hairline across the whole frame; the last one, lengthwise
        // and high on the right, was a thin diagonal. Both are drawn out strip by strip from u 0.548, away from the
        // turn, and their crowds stand up with them (item.late, style.U.uLate). West of the junction it is not built.
        if (A === AVE[1]) { if (v < -30) continue; it.wedge = false; it.free = true; it.key = frontOfU(0.548) + 5 * Math.abs(Math.round(v / (L / n))); it.slide = [(v > 0 ? 1 : -1) * L / n, 0, 0]; }
        if (A === AVE[2]) { it.wedge = false; it.free = true; it.key = frontOfU(0.556) + 5 * j; it.slide = [0, 0, -L / n]; }   // the first avenue draws itself out ahead of the rising lift, in the upper half of the rise (earlier it lay across the boughs as one stray stroke; from the landing the front stands under 80, so it is ruled as the second flight starts)
        items.push(it); }
      if (L < 170) continue;
      const lanes = A.w > 8 ? [-3, -1, 1, 3] : [-2.1, 0, 2.1], per = Math.floor((L - 150) / (A.own ? 6.5 : 20) * Math.min(1.3, busy)) + 1;
      for (const off of lanes) for (let k = 0; k < per; k++) {
        const v = gz(lo + 75 + (L - 150) * (k + rc()) / per) + 3, dir = off < 0 ? -1 : 1, s0 = rc.chance(0.25) ? 1.7 : 2.9, s = A.own ? s0 : s0 * 1.55;
        const p = A.a === 0 ? [v, A.y + (A.own ? 0.2 : 0.55) + 0.02 * k, A.c + off * 1.05] : [A.c + off * 1.05, A.y + (A.own ? 0.2 : 0.55) + 0.02 * k, v];
        const it = { p, s: [s, 0.3, s], c: rc.pick(shuttleC), hop: A.a === 0 ? [6 * dir, 0, 0] : [0, 0, 6 * dir], phase: rc(), wedge: true, bold: !A.own };
        if (A === AVE[1] || A === AVE[2]) { it.late = true; if (A === AVE[1] && v < -24) continue; }
        if (A.own || (!A.ghost && (off === lanes[0] || off === lanes[lanes.length - 1]))) items.push(it);      // a far avenue's crowd: two lanes, larger squares, never specks
      }
    }
    await ctx.yield();
    // the yellow shaft of the second lift, squares riding up and down beside us; and yellow shafts joining levels
    // a shaft is two or three narrow yellow strips with a column of squares riding up and down them, some passing
    // FEW STRIPS, EACH WIDE: a shaft is drawn as one or two broad strips with a few large riders (no rider under
    // about 6 px from the course), so that the shafts of the second lift stand as two clear groups and never as a
    // thicket. (The seeded stream is drawn exactly as before: o only says what is kept of it.)
    let shN = 0;
    const shaft = (x, z, y0, y1, wide, thinAxis, own, o = {}) => {
      const ns = wide > 20 ? 3 : 2, sw = wide / (2 * ns - 1), H = y1 - y0, cells = Math.max(4, Math.min(12, Math.floor(H / 12) - 1)), D = [];
      for (let j = 0; j < ns; j++) {
        const n = Math.max(2, Math.round(H / (own ? 7 : 15) * Math.min(1.2, Math.max(0.85, busy))));
        for (let k = 0; k < n; k++) { const c = rc.pick(shuttleC), ph = cells + rc() * 0.999; D.push([c, ph]); }
      }
      if (o.skip) return;
      const sh = ++shN;
      if (o.y0 !== undefined) { y0 = o.y0; y1 = o.y1; }                 // (what is drawn may be shorter than what the seeded stream was drawn for)
      const nd = o.ns || ns, swd = o.sw || sw, rs2 = o.rider || Math.min(2.3, swd - 0.5), nr = Math.max(2, Math.round((y1 - y0) / (o.per || 16)));
      for (let j = 0; j < nd; j++) {
        const off = (j - (nd - 1) / 2) * swd * 2, h0 = y0 + (j % 2) * 7, h1 = y1 - (o.y0 !== undefined ? 0 : ((j + 1) % 3) * 9), ym = (h0 + h1) / 2;
        items.push({ p: thinAxis === 2 ? [x + off, ym, z] : [x, ym, z + off], s: thinAxis === 2 ? [swd, h1 - h0, 0.4] : [0.4, h1 - h0, swd], c: P.yellow, wedge: true, bold: !own, sh, strip: true });
        for (let k = 0; k < nr; k++) {
          const d = D[(j * nr + k) % D.length], lane = swd > 2.2 * rs2 ? (k % 2 ? 1 : -1) * swd * 0.25 : 0, up = (j + k) % 2 ? 1 : -1, face = thinAxis === 2 ? (z > -476 ? -0.4 : 0.4) : (x > 60 ? -0.4 : 0.4);
          const q = thinAxis === 2 ? [x + off + lane, gy(ym) + 3, z + face] : [x + face, gy(ym) + 3, z + off + lane];
          items.push({ p: q, s: thinAxis === 2 ? [rs2, rs2, 0.3] : [0.3, rs2, rs2], c: d[0], hop: [0, 6 * up, 0], phase: o.y0 !== undefined ? Math.max(2, Math.floor((y1 - y0) / 12) - 1) + (d[1] % 1) : d[1], wedge: true, bold: !own, sh });   // (a shortened strip's riders wrap within it)
        }
      }
    };
    shaft(126, -489.5, 52, 204, 12.4, 2, true, { ns: 2, sw: 5.2, rider: 4.1, per: 14 }); shaft(133, -462.5, 76, 212, 8.4, 2, true, { ns: 2, sw: 4, rider: 3.4, per: 14 });   // the colonnade again: both near shafts stand, close-set
    for (let i = 0; i < 16; i++) {
      await ctx.yield();
      const A = AVE[4 + rc.int(0, Math.max(0, AVE.length - 5))]; if (!A) break;
      const v = rc.range(Math.min(A.from, A.to), Math.max(A.from, A.to)), up = rc.chance(0.5) ? 48 : 96, x = A.a === 0 ? v : A.c + 6, z = A.a === 0 ? A.c + 6 : v;
      let ok = true; for (let t = 0; t <= 8 && ok; t++) if (blocked(x, A.y + up * t / 8, z, 14)) ok = false;
      if (ok) shaft(x, z, A.y - rc.range(2, 20), A.y + up + rc.range(2, 20), A.w, A.a === 0 ? 2 : 0, false, { ns: 1, sw: A.w, rider: A.w * 0.56, per: 32, skip: A.ghost });
    }
    // bars passing overhead like sleepers on the last avenue, none the same length
    for (let k = 0; k < 13; k++) {
      const z = -488 - k * 12 - rc.range(0, 3), y = Y_TOP + (k === 6 ? 27 : 13.2 + (k % 3) * 1.1), thick = k % 5 === 2;
      const x0 = 168 - rc.range(13, 30), x1 = 168 + rc.range(13, 30);
      // seven of them, beginning well down the avenue, each drawn across (from the left, from the right) as we come
      // out of the turn: the first sight of the diamond has open white above it
      if (k < 4 || k === 5 || k === 9 || k >= 11) continue;        // (and none over the diamond itself: a thin bar crossed the top of the outer square)
      const it = bar([x0, y, z - 4], [x1, y, z - 4], k === 6 ? 2.4 : 0.6, lineC(k * 0.23), { ext: 0, far: false });
      it.key = frontOfU(k >= 10 ? 0.862 + 0.019 * (k - 10) : 0.806 + 0.0055 * (k - 4)); it.slide = [(k % 2 ? 1 : -1) * it.s[0], 0, 0]; it.cb = true;
    }

    // THE STANDING GRID: the squared half of the crown, as ONE object. A single wall of 12 m cells on the Tree's own
    // lattice, 48 m ahead of the trunk's line and left of the avenue, in the crown's outline: four cells across and
    // three deep on a stem two cells wide, one upright running down as its trunk. Its bars are the two widths, held
    // wide enough to stay bars from the lift (item.bold); they cross without joining and overrun or stop short. It is
    // squared as we rise: every piece is keyed to the front by its height (a little ahead of the cage, so the whole
    // lattice stands below the eye line by u 0.40), uprights growing cell by cell, rails ruled across from alternate
    // sides, then the panes sliding in like drawers: five or six in the three whites, four in red, yellow and blue.
    // The Tree keeps its own staircases out of this volume (keepOut) and out of the lines of sight to it.
    {
      const GZ = -405, GX = -63, kOf = (y) => 23 + 0.5 * (y - TREE[1]), over = () => (rgd.chance(0.3) ? -rgd.range(1.2, 2.6) : rgd.range(1.5, 5.5));
      const thickUp = rgd.chance(0.5) ? 0 : 4, thickRail = rgd.chance(0.5) ? 72 : 96, gridPaint = rgd.shuffle([P.red, P.yellow, P.blue, rgd.chance(0.5) ? P.red : P.blue]);
      const gi = (it) => { it.free = true; it.bold = true; items.push(it); };
      for (let i = 0; i <= 4; i++) {                                  // uprights, growing upward cell by cell
        const x = GX + 12 * i, w = i === 2 || i === thickUp ? 2.4 : 0.6, yb = i === 2 ? 30 : (i === 0 || i === 4 ? 72 : 60) - over(), yt = 108 + over() + (i === 2 ? 3 : 0);
        for (let y = yb; y < yt - 0.01; y += 12) { const y1 = Math.min(yt, y + 12), L = y1 - y; gi({ p: [x, (y + y1) / 2, GZ + (w > 1 ? 1.3 : 0.5)], s: [w, L, w > 1 ? 0.7 : 0.6], c: lineC(rgd()), slide: [0, L, 0], key: kOf(y) + i * 0.7 }); }
      }
      for (let j = 0; j <= 4; j++) {                                  // rails, ruled across from alternate sides
        const y = 60 + 12 * j, x0 = (j === 0 ? GX + 12 : GX) - over(), x1 = (j === 0 ? GX + 36 : GX + 48) + over(), w = y === thickRail ? 2.4 : 0.6, L = x1 - x0;
        gi({ p: [(x0 + x1) / 2, y, GZ - (w > 1 ? 1.1 : 0.5)], s: [L, w, w > 1 ? 0.7 : 0.6], c: lineC(rgd()), slide: [(j % 2 ? 1 : -1) * L, 0, 0], key: kOf(y) + 2 });
      }
      const cells = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (j > 0 || i === 1 || i === 2) cells.push([i, j]);
      rgd.shuffle(cells); const nWhite = rgd.int(5, 6), rows = rgd.shuffle([1, 2, 3, rgd.int(1, 3)]);
      for (let i = 0; i < 4; i++) { const k = cells.findIndex((q) => q[0] === i && q[1] === rows[i]), q = cells[k]; cells.splice(k, 1); cells.splice(i, 0, q); }   // the four paints: one to a column
      for (let n = 0; n < 4 + nWhite; n++) {
        const i = cells[n][0], j = cells[n][1], prim = n < 4, r2 = rgd(), r3 = rgd(), r4 = rgd();
        const c = prim ? gridPaint[n] : style.whites[Math.floor(r2 * 2.999)], w = 8.4 - (r3 < 0.25 ? 1.6 : 0), h = 8.4 - (r3 > 0.8 ? 1.6 : 0);
        const horiz = r4 < 0.6, sl = horiz ? [(r4 < 0.3 ? 1 : -1) * w, 0, 0] : [0, (r4 < 0.8 ? 1 : -1) * h, 0];
        gi({ p: [GX + 12 * i + 6 + (r3 - 0.5) * 0.5, 60 + 12 * j + 6 + (r2 - 0.5) * 0.5, GZ - 2.2 - 0.05 * n], s: [w, h, 0.3], c, edge: c, slide: sl,
          key: kOf(72 + 12 * j) + (prim ? 5 + r2 * 7 : 3 + r2 * 6), drawer: !prim && r3 > 0.45 && r3 < 0.62 });
        items[items.length - 1].bold = false;
      }
    }
    // THE NEAR BOUGHS: the rise goes THROUGH the Tree. Five boughs stand within 14 to 26 m of the lift line, in planes
    // square to the gaze, so their runs are seen as bars and never end-on: three pass on the right as we rise, two on
    // the left. Each is stored in two shapes like the Tree itself: a curve in the bough's paint (a ribbon, with a few
    // petals) and a stair of level runs and uprights in the two widths. The front squares them from the bottom up: a
    // run is ruled out along its length as the cage comes level with it, the curve is painted out below the eye line,
    // and a pane of red, blue or yellow is drawn into one step like a drawer. A still catches each half curve, half
    // stair. Placed by fixed numbers (no seeded draw), all below the level leg, none in front of the standing grid.
    const nbPos = [], nbKey = [], nbT = [], nbCol = [], nbIdx = [], keyOf = (y, z) => (y - 5) + 0.06 * (z + 345) - 12;
    const boughC = evening ? pal.red : pal.grey, petalC = night ? day.w2 : (season === 'bare' ? pal.grey : pal.whiteWarm);
    const nb = (it) => { it.free = true; it.c = it.c || P.line; items.push(it); };
    const nearBough = (o) => {
      let x = o.x, y = o.y; const d = o.dir, K = o.k || 1, panes = o.panes || (o.pane ? [o.pane] : []), pts = [[x - d * 3 * K, y - 0.6 * K], [x, y]];
      o.steps.forEach((st, i) => {
        const x1 = x + d * st[0], y1 = y + st[1], w = (i === o.thick ? 0.85 : 0.36) * K, e0 = (0.6 + 1.2 * ((i * 0.618 + o.y * 0.37) % 1)) * K, e1 = (i % 2 ? -0.7 : 1.2) * K, L = st[0] + e0 + e1;
        nb({ p: [(x + x1) / 2 + d * (e1 - e0) / 2, y, o.z], s: [L, w, 0.12], slide: [d * L, 0, 0], key: keyOf(y, o.z), bold: true });          // the level run
        if (st[1] > 0) nb({ p: [x1, (y + y1) / 2 + 0.5 * K, o.z + 0.8], s: [(i === o.thickUp ? 0.85 : 0.36) * K, st[1] + 2.6 * K, 0.12], slide: [0, st[1] + 2.6 * K, 0], key: keyOf(y, o.z) + 3, bold: true });   // the upright that takes it up a step
        for (const pn of panes) if (pn[0] === i && o.steps[i + 1]) {   // a pane, in the notch under the next run
          const pw = (K > 1 ? o.steps[i + 1][0] : Math.min(o.steps[i + 1][0], st[1])) - 1.25 * K, ph = (K > 1 ? st[1] : pw + 1.25 * K) - 1.25 * K;
          nb({ p: [x1 + d * (0.62 * K + pw / 2), y1 - 0.62 * K - ph / 2, o.z - 0.9], s: [pw, ph, 0.12], c: pn[1], edge: pn[1], slide: pn[2] ? [0, -ph, 0] : [d * pw, 0, 0], key: keyOf(y1, o.z) + 6, drawer: !pn[2] });
        }
        x = x1; y = y1; pts.push([x, y]);
      });
      if (!o.curve) return;
      pts.push([x + d * o.curve[0], y + o.curve[1]], [x + d * o.curve[2], y + o.curve[3]]);
      // the curve: a quadratic spline over the stair's corners, tapering to its tip
      const sm = []; for (let j = 0; j + 2 < pts.length; j++) {
        const a = j === 0 ? pts[0] : [(pts[j][0] + pts[j + 1][0]) / 2, (pts[j][1] + pts[j + 1][1]) / 2], c = pts[j + 1], b = j + 3 === pts.length ? pts[j + 2] : [(pts[j + 1][0] + pts[j + 2][0]) / 2, (pts[j + 1][1] + pts[j + 2][1]) / 2];
        for (let k = (j === 0 ? 0 : 1); k <= 5; k++) { const t = k / 5, u0 = (1 - t) * (1 - t), u1 = 2 * t * (1 - t), u2 = t * t; sm.push([a[0] * u0 + c[0] * u1 + b[0] * u2, a[1] * u0 + c[1] * u1 + b[1] * u2]); }
      }
      const n = sm.length, base = nbPos.length / 3, z = o.z + 0.35, dabs = []; let yMax = -1e9;
      for (let k = 0; k < n; k++) {
        const p = sm[k], q0 = sm[Math.max(0, k - 1)], q1 = sm[Math.min(n - 1, k + 1)], tl = Math.max(1e-4, Math.hypot(q1[0] - q0[0], q1[1] - q0[1])), tx = (q1[0] - q0[0]) / tl, ty = (q1[1] - q0[1]) / tl;
        const t = k / (n - 1), w = (K > 1 ? 0.52 - 0.24 * t : 0.42 - 0.32 * t) * K; yMax = Math.max(yMax, p[1]);
        for (const sgn of [-1, 1]) { nbPos.push(p[0] - ty * w * sgn, p[1] + tx * w * sgn, z); nbKey.push(keyOf(yMax, o.z) + 12); nbT.push(t); nbCol.push(boughC.r, boughC.g, boughC.b); }
        if (k + 1 < n) { const a = base + k * 2; nbIdx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
        if (k > 4 && k % (o.dabEvery || 5) === 2) { const sd = (k % 2 ? 1 : -1) * (w + 0.75 * K); dabs.push([p[0] - ty * sd, p[1] + tx * sd, tx, ty, keyOf(yMax, o.z) + 12, t]); }
      }
      for (const [cx, cy, tx, ty, key, t] of dabs) {                   // a petal dab beside the stroke, and the square it becomes
        const b = nbPos.length / 3;
        for (let m = 0; m < 8; m++) { const an = m * Math.PI / 4, ex = Math.cos(an) * 0.85 * K, ey = Math.sin(an) * 0.42 * K; nbPos.push(cx + tx * ex - ty * ey, cy + ty * ex + tx * ey, z + 0.1); nbKey.push(key); nbT.push(t); nbCol.push(petalC.r, petalC.g, petalC.b); }
        for (let m = 1; m < 7; m++) nbIdx.push(b, b + m, b + m + 1);
        nb({ p: [cx, cy, z + 0.1], s: [0.8 * K, 0.8 * K, 0.12], c: petalC, edge: petalC, slide: [0.8 * K, 0, 0], key: key - 1 });
      }
    };
    nearBough({ x: 7, y: 42, z: -301, dir: 1, steps: [[4.5, 4.5], [4.5, 5], [4, 0]], thick: 0, pane: [0, P.red], curve: [4, 4, 7, 2.5] });
    nearBough({ x: 7.5, y: 66.5, z: -311.5, dir: 1, steps: [[4, 5], [4.5, 4.5], [4, 0]], thick: 1, thickUp: 0, pane: [0, P.blue], curve: [4, 4.5, 7, 3] });
    // THE CHANGE IN ONE OBJECT: the third on the right is built 1.75 times larger and stands 46 m ahead of the lift,
    // right of centre: a stair of two steps in the two widths with a white pane and a
    // pane of paint in its notches, a third upright being ruled at the eye line, and above it the same limb as one curve
    nearBough({ x: 6, y: 82, z: -350, dir: 1, k: 1.8, dabEvery: 3, steps: [[6, 8], [6, 8], [5, 6]], thick: 1, panes: [[0, pal.whiteBright, 1], [1, P.yellow]], curve: [3.5, 2.5, 10.5, -1] });
    nearBough({ x: -23.5, y: 38, z: -303, dir: 1, steps: [[3.5, 4.5], [3.5, 5], [3, 5.5], [2.5, 0]], thick: 1, pane: [0, P.yellow], curve: [3, 4.5, 5.5, 3.5] });
    nearBough({ x: -25, y: 86.5, z: -326, dir: 1, steps: [[3.5, 4.5], [3, 5], [3, 5.5], [2, 0]], thick: 0, thickUp: 2, pane: [0, P.red], curve: [3, 4.5, 5.5, 4] });
    // ONE TREE, HALF CURVE AND HALF GRID. Four of the standing grid's uprights go on above its top rail as curved
    // boughs in the bough's paint, as thick at the root as the thick bar, with petals, sweeping up and to the right
    // toward the avenue's wedge: from the landing and through the second flight the curved crown stands directly on
    // the lattice. Each is being ruled straight from its foot as the eye line comes up to it (a short upright going
    // on from the grid's upright, then a level run growing out to the right), and the curve is painted out from the
    // foot upward just before plane A is drawn behind it (front 97 to 103). Fixed numbers, no seeded draw.
    {
      const OZ = -403.1, SH = [[[0, 0], [0.6, 9], [5.5, 18], [15, 23.5], [25, 23]], [[0, 0], [0.4, 7], [4.5, 14.5], [12.5, 19], [20.5, 18]], [[0, 0], [0.8, 10], [6.5, 20.5], [17, 27], [28, 27.5]], [[0, 0], [0.5, 7.5], [4.5, 15], [12, 20], [19, 20.5]]];
      for (let i = 0; i < 4; i++) {
        const x0 = -63 + 12 * i, y0 = 107, C = SH[i].map((q) => [x0 + q[0], y0 + q[1]]), sm = [], NS = 26;
        for (let k = 0; k <= NS; k++) {                              // a Catmull-Rom curve through the five points
          const f = k / NS * (C.length - 1), j = Math.min(C.length - 2, Math.floor(f)), t = f - j, a = C[Math.max(0, j - 1)], b = C[j], c = C[j + 1], d = C[Math.min(C.length - 1, j + 2)];
          const cr = (m) => 0.5 * (2 * b[m] + (c[m] - a[m]) * t + (2 * a[m] - 5 * b[m] + 4 * c[m] - d[m]) * t * t + (3 * b[m] - a[m] - 3 * c[m] + d[m]) * t * t * t);
          sm.push([cr(0), cr(1)]);
        }
        const base = nbPos.length / 3, dabs = [];
        for (let k = 0; k <= NS; k++) {
          const p = sm[k], q0 = sm[Math.max(0, k - 1)], q1 = sm[Math.min(NS, k + 1)], tl2 = Math.max(1e-4, Math.hypot(q1[0] - q0[0], q1[1] - q0[1])), tx = (q1[0] - q0[0]) / tl2, ty = (q1[1] - q0[1]) / tl2;
          const t = k / NS, w = 1.2 - 0.82 * t, key = t < 0.2 ? 80 + 3 * i + 50 * t : 97 + 6 * t;   // (the foot is painted out as its upright is ruled; the rest just before plane A)
          for (const sgn of [-1, 1]) { nbPos.push(p[0] - ty * w * sgn, p[1] + tx * w * sgn, OZ); nbKey.push(key); nbT.push(t * 1.5); nbCol.push(boughC.r, boughC.g, boughC.b); }
          if (k < NS) { const a = base + k * 2; nbIdx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
          if (k >= 7 && (k - 7) % 4 === 0 && dabs.length < 5) { const sd = (dabs.length % 2 ? 1 : -1) * (w + 1.25); dabs.push([p[0] - ty * sd, p[1] + tx * sd, tx, ty, key, t * 1.5]); }
        }
        for (const [cx, cy, tx, ty, key, t] of dabs) {               // petals: ovals beside the stroke, painted out with it
          const b = nbPos.length / 3;
          for (let m = 0; m < 8; m++) { const an = m * Math.PI / 4, ex = Math.cos(an) * 1.5, ey = Math.sin(an) * 0.78; nbPos.push(cx + tx * ex - ty * ey, cy + ty * ex + tx * ey, OZ + 0.1); nbKey.push(key); nbT.push(t); nbCol.push(petalC.r, petalC.g, petalC.b); }
          for (let m = 1; m < 7; m++) nbIdx.push(b, b + m, b + m + 1);
        }
        // being ruled straight: the upright goes on a little above the rail, then a level run grows out of the foot
        const kk = 78 + 3 * i, up = 6.6 + (i % 2) * 2.4, run = 8.2 - (i % 3) * 1.1;
        items.push({ p: [x0, 108.2 + up / 2, -403.6], s: [0.6, up, 0.5], c: P.line, slide: [0, up, 0], key: kk, free: true, bold: true });
        items.push({ p: [x0 + run / 2 - 0.9, 108.2 + up - 0.9, -403.9], s: [run, 0.6, 0.5], c: P.line, slide: [run, 0, 0], key: kk + 4, free: true, bold: true });
      }
    }
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(nbPos, 3)); g.setAttribute('aKey', new THREE.Float32BufferAttribute(nbKey, 1));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(nbT, 1)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(nbCol, 3)); g.setIndex(nbIdx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uFront: U.uFront, uTime: U.uTime }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute float aKey, aT; attribute vec3 aCol; uniform float uTime; varying float vK; varying vec3 vC;
          void main(){
            vK = aKey; vC = aCol;
            vec3 p = position; p.y += .45 * aT * aT * sin(uTime * 1.7 + position.x * .21); p.x += .3 * aT * aT * sin(uTime * 1.1 + position.y * .17);   // the curved end still moves in the wind
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: 'uniform float uFront; varying float vK; varying vec3 vC; void main(){ if (uFront > vK || uFront < -1000.) discard; gl_FragColor = vec4(vC, 1.); }' }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // the first avenue begins under the level-off itself (one more strip, drawn out like the rest), and the first of
    // its crowd steps on it there: six squares that keep to its first eighty metres. Placed by index.
    items.push({ p: [0, Y_AVE - 6.2, -342], s: [9, 0.4, 28], c: P.yellow, free: true, key: 80.4, slide: [0, 0, -28] });
    for (let i = 0; i < 9; i++) {
      const off = [-3, 1, 3, -1][i % 4], sq = i % 3 === 1 ? 1.7 : 2.9;
      items.push({ p: [off * 1.05, Y_AVE - 6 + 0.34 + 0.015 * i, gz(-362 - 7 * i) + 3], s: [sq, 0.3, sq], c: [P.red, P.blue, night ? day.w2 : pal.black][i % 3], hop: [0, 0, 6 * (off < 0 ? -1 : 1)], phase: 3 + ((i * 0.381966 + 0.29) % 1) * 0.999, wedge: true });
    }
    await ctx.yield();

    // planes: unlit rectangles 0.8 m thick on the Tree's lattice, each on its own layer, none closing a box
    const mixW = night ? [0.5, 0.14, 0.2, 0.16] : colourway === 'white' ? [0.95, 0, 0, 0] : colourway === 'yellow' ? [0.52, 0.08, 0.27, 0.07] : [0.68, 0.1, 0.09, 0.09];
    const paint = (r) => (r < mixW[0] ? style.whites[Math.floor(r / mixW[0] * 2.999)] : r < mixW[0] + mixW[1] ? P.red : r < mixW[0] + mixW[1] + mixW[2] ? P.yellow
      : r < mixW[0] + mixW[1] + mixW[2] + mixW[3] ? P.blue : (night ? P.red : style.whites[2]));
    const edgeOf = (c, r) => (r < 0.6 ? c : r < 0.78 ? (night ? P.yellow : pal.black) : r < 0.86 ? P.red : r < 0.93 ? P.blue : P.yellow);
    const nearTree = (x, y, z) => y < 222 && Math.hypot(x - TREE[0], z - TREE[2]) < 121;
    let nPlanes = 0, nDrawers = 0;
    function planeOK(p, s, o, clr) {
      const u = o === 0 ? 2 : 0, v = o === 1 ? 2 : 1;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
        const q = [p[0], p[1], p[2]]; q[u] += s[u] * i * 0.25; q[v] += s[v] * j * 0.25;
        if (q[1] < 2 || blocked(q[0], q[1], q[2], clr) || nearTree(q[0], q[1], q[2])) return false;
        if (o === 1 && (i + j) % 2 === 0 && underPath(q[0], q[1], q[2])) return false;
      }
      return true;
    }
    function tryPlane(cx, cy, cz, o, a, b, c, mayBar) {
      const s = o === 0 ? [0.8, a, b] : o === 1 ? [a, 0.8, b] : [a, b, 0.8], p = [gx(cx), gy(cy), gz(cz)], big = Math.max(a, b);
      p[o] += rc.range(-2.2, 2.2);
      const clr = o === 1 ? 10 : Math.max(12, big * 0.36), r1 = rc(), r2 = rc(), r3 = rc(), r4 = rc(), r5 = rc(), r6 = rc();
      if (!planeOK(p, s, o, clr) || (mayBar !== null && voidAt(p[0], p[1], p[2]))) return false;
      const it = { p, s, c, edge: edgeOf(c, r1), keep: !style.whites.includes(c) && r5 < 0.34 };
      if (r2 < 0.4 && big < 110) {                                   // a drawer: slides 30-80 m along its long side, rests, comes back
        const ax = o === 1 ? (a >= b ? 0 : 2) : (o === 0 ? (b >= a * 0.8 ? 2 : 1) : (a >= b * 0.8 ? 0 : 1)), sl = [0, 0, 0];
        sl[ax] = (30 + r3 * 50) * (r4 < 0.5 ? 1 : -1);
        const q1 = [p[0] + sl[0] * 0.55, p[1] + sl[1] * 0.55, p[2] + sl[2] * 0.55], q2 = [p[0] + sl[0] * 1.08, p[1] + sl[1] * 1.08, p[2] + sl[2] * 1.08];
        if (planeOK(q1, s, o, clr) && planeOK(q2, s, o, clr)) { it.slide = sl; it.phase = r5; nDrawers++; }
      }
      it.gen = 1; it.pln = true; items.push(it); nPlanes++;
      if (mayBar) {                                                  // the bars that hold it: along an edge, overrunning, never joining
        const u = o === 0 ? 2 : 0, v = o === 1 ? 2 : 1, nb = r6 < 0.36 ? 0 : (r6 < 0.86 ? 1 : 2);
        for (let k = 0; k < nb; k++) {
          const along = k === 0 ? (s[u] >= s[v] ? u : v) : (s[u] >= s[v] ? v : u), across = along === u ? v : u, w = rc.chance(0.12) ? 2.4 : 0.6;
          const q0 = p.slice(), q1 = p.slice(), side = rc.chance(0.5) ? 1 : -1;
          q0[across] = q1[across] = p[across] + side * (s[across] / 2 + 0.9 + w / 2);
          q0[along] = p[along] - s[along] / 2 - rc.range(1.5, 14); q1[along] = p[along] + s[along] / 2 + rc.range(-3, 16);
          q0[o] = q1[o] = p[o] + (rc.chance(0.5) ? 1 : -1) * rc.range(0.9, 2.2);
          tryBar(q0, q1, w, lineC(rc()));
        }
      }
      return true;
    }
    let nBars = 0;
    function tryBar(a, b, w, c) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.ceil(L / 6));
      for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t; if (blocked(x, y, z, w > 1 ? 42 : 14) || (nearTree(x, y, z) && y > TREE[1] + 30)) return false; }
      const it = bar(a, b, w, c, { ext: 0 }); it.gen = 2; it.cb = true; nBars++; return true;
    }
    const NEAR = [10.4, 16.4, 16.4, 22.4, 22.4, 28.4, 34.4, 46.4, 58.4], FAR = [46.4, 58.4, 70.4, 94.4, 118.4, 154.4];
    const pv = new THREE.Vector3(), cityD0 = dLift1 - 30, cityD1 = path.length + 90;
    const nNear = Math.round(700 * busy), nFar = Math.round(480 * Math.min(1.2, busy));
    for (let i = 0, tries = 0; i < nNear && tries < nNear * 4; tries++) {
      path.posAtDist(cityD0 + (cityD1 - cityD0) * rc(), pv);
      const ang = rc.range(0, 6.283), rad = 13 + 190 * Math.pow(rc(), 1.5), o = rc.int(0, 2), k = rc();
      const a = NEAR[Math.floor(rc() * (4 + 5 * Math.min(1, rad / 120)))], b = NEAR[Math.floor(rc() * (4 + 5 * Math.min(1, rad / 120)))];
      if (tryPlane(pv.x + Math.cos(ang) * rad, pv.y + rc.gauss() * 46 - 8, pv.z + Math.sin(ang) * rad, o, a, b, paint(k), true)) i++;
      if (tries % 4 === 3) await ctx.yield();
    }
    for (let i = 0, tries = 0; i < nFar && tries < nFar * 3; tries++) {
      const x = rc.range(-760, 1050), z = rc.range(-1520, -470), y = Math.abs(rc.gauss()) * 150 + rc.range(6, 60), o = rc.int(0, 2), k = rc();
      if (tryPlane(x, Math.min(430, y), z, o, rc.pick(FAR), rc.pick(FAR), paint(k), rc.chance(0.6))) i++;
      if (tries % 4 === 3) await ctx.yield();
    }
    // free bars: long verticals and horizontals of the two widths running through many levels
    for (let i = 0; i < Math.round(360 * busy); i++) {
      path.posAtDist(cityD0 + (cityD1 - cityD0) * rc(), pv);
      const ang = rc.range(0, 6.283), rad = 11 + 240 * Math.pow(rc(), 1.4), ax = rc.pick([1, 1, 0, 2]), L = rc.range(40, 260), w = rc.chance(0.13) ? 2.4 : 0.6;
      const m = [gx(pv.x + Math.cos(ang) * rad), gy(pv.y + rc.gauss() * 50), gz(pv.z + Math.sin(ang) * rad)], a = m.slice(), b = m.slice();
      a[ax] -= L * rc(); b[ax] = a[ax] + L; if (ax === 1) { a[1] = Math.max(-1.3, a[1]); b[1] = Math.max(a[1] + 30, b[1]); }
      tryBar(a, b, w, lineC(rc()));
      if (i % 8 === 7) await ctx.yield();
    }
    if (colourway === 'white' && !night) tryPlane(30, Y_AVE + 10, -520, 2, 16.4, 16.4, P.blue, null) || tryPlane(-34, Y_AVE + 4, -440, 0, 16.4, 16.4, P.blue, null);
    // THE COMPOSITION. From the level-off to the second lift the flight passes through one picture made of a few
    // large planes at clearly different depths, each drawn out of one edge as we level off (keyed to the front, so
    // nothing of it stands behind the Tree during the rise): a big square high on the left over the standing grid
    // (16 m off), a yellow plane we pass under, a red or blue one low on the right beside the turn, a far one closing
    // the avenue; then on the cross avenue the plane that draws back overhead and a tall one on the left. Every
    // plane is a palette colour with a black rim and black bars that run past it without joining.
    const swap = (r3 * 13) % 1 < 0.5, c1 = swap ? P.red : P.blue, c2 = swap ? P.blue : P.red, rim = night ? P.yellow : pal.black, COMP = [];
    const comp = (p, sz, c, key, sl) => { const it = { p, s: sz, c, edge: rim, key, slide: sl, free: true, pln: true }; items.push(it); COMP.push(it); };
    const cbar = (a, b, w, key, dir, bold) => { const it = style.bar(a, b, w, lineC(0.07 * key), { ext: 0 }); it.bold = true; it.cb = true; const ax = it.s[0] > w ? 0 : (it.s[1] > w ? 1 : 2), sl = [0, 0, 0]; sl[ax] = dir * it.s[ax]; it.key = key; it.slide = sl; it.free = true; items.push(it); return it; };
    comp([-43, 149, -420.6], [54, 54, 0.8], c1, 104, [0, 54, 0]);                    // A: high on the left
    cbar([-73.6, 104, -418.4], [-73.6, 190, -418.4], 2.4, 106, 1); cbar([-13.4, 110, -419], [-13.4, 184, -419], 0.6, 107, -1); cbar([-90, 119.2, -419.2], [-6, 119.2, -419.2], 0.6, 108, 1);
    comp([12, 133.6, -425], [40, 0.8, 54], P.yellow, 109, [0, 0, -54]);              // C: overhead
    cbar([-18, 131.2, -436], [40, 131.2, -436], 2.4, 112, -1); cbar([-13, 132.4, -409], [27, 132.4, -409], 0.6, 111, 1);
    comp([31, 97, -462.4], [30, 26, 0.8], c1, 114, [30, 0, 0]);   // B: low on the right, at the turn: 30 by 26 m, with white round it from the first avenue; drawn shut into one edge as we come up to it (THE DRAWER'S RULE, below)
    cbar([10.4, 58, -461], [10.4, 125, -461], 2.4, 116, 1); cbar([6, 67.6, -463.6], [72, 67.6, -463.6], 0.6, 118, 1).undo = true;
    comp([-38, 143, -534.8], [64, 54, 0.8], c2, 122, [0, 54, 0]);                    // D: far, closing the avenue
    cbar([-88, 113.6, -533.6], [8, 113.6, -533.6], 2.4, 124, 1); cbar([-3.4, 104, -533.2], [-3.4, 180, -533.2], 0.6, 126, 1);
    comp([96.4, 139, -519], [0.8, 42, 34], c2, 300, [0, 42, 0]);   // G: tall on the left of the cross avenue (drawn shut into one edge as we come up to it: THE DRAWER'S RULE)
    cbar([97.8, 100, -499.4], [97.8, 174, -499.4], 0.6, 304, 1);
    // the plane that draws back overhead on the cross avenue: always a paint, with the one bar it draws back over
    items.push({ p: [70, Y_AVE + 26, -476], s: [58.4, 0.8, 34.4], c: c1, edge: c1, key: frontOfU(0.632), slide: [58.4, 0, 0], drawer: true, free: true, pln: true });   // (drawn out over our heads once the turn is over, from its near edge forward, square to the avenue: seen from the turn it came in from a corner as a wedge with a diagonal edge)
    cbar([103.6, Y_AVE + 24.6, -452], [103.6, Y_AVE + 24.6, -508], 0.6, 294, -1);
    // THE FIRST LINES. Behind the dune the white ground is where the grid begins: long black bars of the two widths
    // lying on it along X, and four flat planes of paint between them (below). Hidden from the sea by the dune; each
    // draws itself out along its length as the lift starts to rise, so the rise looks down on a picture being ruled.
    [[[26, -398], [244, -398], 0.6], [[-150, -416], [62, -416], 2.4], [[52, -392], [52, -604], 0.6], [[70, -452], [334, -452], 2.4], [[-70, -400], [-70, -524], 0.6],
      [[118, -430], [118, -770], 2.4], [[-224, -500], [140, -500], 0.6], [[206, -396], [206, -528], 0.6], [[20, -562], [424, -562], 2.4], [[-264, -642], [92, -642], 0.6]].forEach((g, i) => {
      // ruled in pieces of about 40 m, one after another, so that each piece greys by its own distance
      if (i === 2 || i === 5 || i === 4 || i === 7) return;                                 // seen from the lift, the two that ran along the course under it were diagonals across the picture: left out
      const y = g[2] > 1 ? -0.1 : -0.95, dir = i % 3 === 1 ? -1 : 1, Lg = Math.hypot(g[1][0] - g[0][0], g[1][1] - g[0][1]), n = Math.max(1, Math.round(Lg / 40));
      for (let k = 0; k < n; k++) { const f0 = k / n, f1 = (k + 1) / n, px = (f) => g[0][0] + (g[1][0] - g[0][0]) * f, pz = (f) => g[0][1] + (g[1][1] - g[0][1]) * f;
        const gl = cbar([px(f0), y, pz(f0)], [px(f1), y, pz(f1)], g[2], 6 + 3 * i + 2.2 * (dir > 0 ? k : n - 1 - k), dir, true); gl.undo = true; gl.far = false; }   // (black at every distance: they are gone before they could be far)   // (all of them lie along X: ruled out again before the turn onto the cross avenue, from which they were diagonals)
    });
    // THE FIRST PICTURE (round first picture): the paints are four large fields: three to the right of the course, each lying from one first line to the next
    // (near edge and far edge on a line), and one to the left of the Tree, from a line out into open white. Like every plane of paint they keep THE DRAWER'S RULE by their
    // size (so they draw shut as we come over them); the fog's cut never leaves them out (item.keep). [x, z of the centre, width along X, depth along Z, paint, key, slide]
    for (const g of [[112, -425, 76, 54, c2, 13, [76, 0, 0]], [190, -507, 80, 110, P.yellow, 19, [0, 0, -110]], [90, -531, 100, 62, c1, 25, [-100, 0, 0]], [-182, -550, 84, 100, c2, 22, [0, 0, -100]]]) items.push({ p: [g[0], -1.05 - 0.01 * g[5], g[1]], s: [g[2], 0.4, g[3]], c: g[4], edge: g[4], key: g[5], slide: g[6], free: true, pln: true, keep: true });
    // THE OPENING'S PLANES. Colour is in the picture from the entry: five large planes of paint stand on the
    // white plain at different depths. A near one on the right that
    // is passed at once; one left of the line at mid distance; one behind the flight of steps; one standing in the
    // surf to the right, beyond the pier; one far to the left, floating high over the dune like the city's own (so it
    // is seen over the near ones). The last two are drawn shut into one edge as we come up to them
    // (item.seaOut: THE DRAWER'S RULE, below).
    for (const g of [[19.5, 6.2, -46, 9, 12.4, P.red, 0], [-50, 15, -150, 24, 30, P.blue, 0], [-36, 13, -194, 20, 26, P.red, 0],
      [84, 30, -275, 52, 60, P.blue, 1], [-216, 120, -420, 86, 60, P.yellow, 1]]) {
      const it = { p: [g[0], g[1], g[2]], s: [g[3], g[4], 0.8], c: g[5], edge: g[5], free: true }; if (g[6]) it.seaOut = true; items.push(it);
    }
    // far off, three towers that are only stacks of white planes of slightly different whites
    for (const T of [[-230, -1380, 396], [150, -1500, 444], [560, -1320, 348]]) {
      for (let y = 12, k = 0; y < T[2]; y += 12, k++) items.push({ p: [T[0] + (k % 5 - 2) * 1.5, y, T[1] + (k % 3 - 1) * 2], s: [84 - (k % 4) * 6, 0.8, 84 - (k % 3) * 8], c: style.whites[(k * 7 + (k >> 2)) % 3] });
      // (the two bars that stood by each tower were grey hairlines from everywhere: left out)
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the exit: the one diagonal in the world
    // a square frame hung on its point: four bars that overrun at the corners, built square and turned 45 degrees
    const frame = new THREE.Group(), fi = [], fr = () => rc.range(1.2, 6.5);
    const fbar = (x, y, sx, sy, z) => fi.push({ p: [x, y, z], s: [sx, sy, 0.7], c: P.line });
    { const a = fr(), b = fr(); fbar(-8.2, (b - a) / 2, 2.4, 18.8 + a + b, 1.0); }
    { const a = fr(), b = fr(); fbar(8.2, (b - a) / 2, 2.4, 18.8 + a + b, 1.0); }
    { const a = fr(), b = fr(); fbar((b - a) / 2, 8.2, 18.8 + a + b, 2.4, 2.2); }
    { const a = fr(), b = fr(); fbar((b - a) / 2, -8.2, 18.8 + a + b, 2.4, 2.2); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) fi.push({ p: [sx * 6.7, sy * 6.7, 0.45], s: [1.3, 1.3, 0.3], c: pal.whiteBright });
    fi.push({ p: [-8.2, -13.4, 1.6], s: [1.5, 1.5, 0.5], c: P.cap }, { p: [13.2, 8.2, 2.8], s: [1.5, 1.5, 0.5], c: P.red });
    // and a second square ruled round the first as we come down the last avenue, bar by bar (u 0.885 to 0.93): from
    // the gate the diamond is small; at the end it is the whole picture
    for (let k = 0; k < 4; k++) {
      const a = fr() + 1.5, b = fr() + 1.5, L = 29.2 + a + b, ko = frontOfU(0.884 + 0.011 * k), sg = k % 2 ? 1 : -1;
      if (k < 2) fi.push({ p: [(k ? 1 : -1) * 13.4, (b - a) / 2, 1.0], s: [2.4, L, 0.7], c: P.line, key: ko, slide: [0, sg * L, 0] });
      else fi.push({ p: [(b - a) / 2, (k === 2 ? 1 : -1) * 13.4, 2.2], s: [L, 2.4, 0.7], c: P.line, key: ko, slide: [sg * L, 0, 0] });
    }
    frame.add(style.boxes(fi)); frame.position.set(PORTAL[0], PORTAL[1], PORTAL[2]); frame.rotation.z = Math.PI / 4; scene.add(frame);
    items.push({ p: [PORTAL[0] + 2, PORTAL[1] + 4, PORTAL[2] - 46], s: [106.4, 100.4, 0.8], c: pal.whiteBright, edge: night ? P.yellow : pal.black });
    // (round the ground is a painting) THE EXIT'S WHITE GROUND IS A PAINTING, the one flat picture in the world. It stood
    // blank: a white pane over a third of the frame from the last turn to the end. Four lines through it and a short
    // fifth rule it, just before its plane, into a border of cells (11 to 15 m clear) round the diamond's cell (about
    // 75 by 70 m clear), whose ground stays white; three cells of the border are fields of paint: red top left, blue
    // bottom left, yellow at the right, which works like a drawer along x (9 m out and back, a little past rest on
    // the return). WHERE THE LINES STAND: every line's inner edge lies outside the last avenue's open channel of
    // NOTHING DOMINATES below (30 m from the avenue's axis: 32.8 m below it, 35.8 left, 36.8 above, 38.8 right), so
    // the diamond hangs in a white cell broader than the channel; toward the end of the last avenue its two squares lie
    // across the lines in the picture, as they come to cover the whole ground. ON THIS GROUND ONLY lines join, ends
    // are flush with the ground's outline and fields fill their cells to the lines: a painting; everywhere else in
    // the world planes never meet. At night the lines are the night's yellow, so the yellow field and its lines are
    // one paint there. Left out while we are at sea and arriving with the city within two frames of the ground
    // itself (wedge, each box by its own middle). No key.
    { const gx = PORTAL[0] + 2, gy = PORTAL[1] + 4, gz0 = PORTAL[2] - 46, zf = gz0 + 0.8, W2 = 53.2, H2 = 50.2, v1 = -39, v2 = 38, h1 = 34, h2 = -38, hs = -6;
      const ln = (u, v, w, h, dz) => items.push({ p: [gx + u, gy + v, gz0 + dz], s: [w, h, 0.7], c: P.line, edge: P.line, wedge: true });   // (upright lines a step behind the level ones: no two faces that look the same way share a plane)
      const fld = (u0, u1, w0, w1, c, o) => items.push(Object.assign({ p: [gx + (u0 + u1) / 2, gy + (w0 + w1) / 2, zf], s: [u1 - u0, w1 - w0, 0.6], c, edge: c, wedge: true }, o || {}));
      ln(v1, 0, 2.4, 2 * H2, 1.4); ln(v2, 0, 2.4, 2 * H2, 1.4); ln(0, h1, 2 * W2, 2.4, 1.5); ln(0, h2, 2 * W2, 2.4, 1.5); ln((v2 + W2) / 2, hs, W2 - v2, 2.4, 1.5);
      fld(-W2, v1 - 1.2, h1 + 1.2, H2, P.red); fld(v2 + 1.2, W2, h2 + 1.2, hs - 1.2, P.yellow, { slide: [9, 0, 0], phase: 0.61 }); fld(-W2, v1 - 1.2, -H2, h2 - 1.2, P.blue); }
    // the two planes beside it work like drawers, outward only, so neither ever crosses the diamond's white cell
    items.push({ p: [PORTAL[0] - 66, PORTAL[1] + 34, PORTAL[2] - 60], s: [28.4, 46.4, 0.8], c: P.blue, slide: [0, 15, 0], phase: 0.93 }, { p: [PORTAL[0] + 70, PORTAL[1] - 24, PORTAL[2] - 70], s: [34.4, 22.4, 0.8], c: P.red, slide: [13, 0, 0], phase: 0.37 });
    // the crowd on the last avenue: twelve squares that keep between the turn and the diamond (they wrap within the
    // avenue), stepping on the beat in both directions. Placed by index, not by the seeded stream.
    for (let i = 0; i < 12; i++) {
      const off = [-3, 1, -1, 3][i % 4], sq = i % 5 === 2 ? 1.7 : 2.9;
      items.push({ p: [PORTAL[0] + off * 1.05, Y_TOP - 6 + 0.32 + 0.015 * i, gz(-568 - 6 * (i % 5)) + 3], s: [sq, 0.3, sq], c: shuttleC[(i * 3 + 1) % shuttleC.length], hop: [0, 0, 6 * (off < 0 ? -1 : 1)], phase: 7 + ((i * 0.381966 + 0.13) % 1) * 0.999, wedge: true });
    }

    // the shaft at the end of the cross avenue, where a second cage sometimes rises
    // ONE STRIP, WHOLE: seen from the top of the second lift it stands 60 m off with its top and its foot inside the
    // frame and three large riders (it was three strips 190 m tall, cut by the top and the bottom of the frame)
    shaft(207, -476, 55, 245, 30, 0, true, { ns: 1, sw: 6, rider: 4.4, per: 19, y0: 135, y1: 191 });
    const cage2 = new THREE.Group(); cage2.add(style.boxes(cageItems)); cage2.rotation.y = -Math.PI / 2; cage2.position.set(194, 90, -476);
    cage2.scale.setScalar(secondCage ? 2.2 : 0); scene.add(cage2);

    // the rare event, the one that got away: a single grey gull, two curved strokes, the only living curve in the grid
    const gullU = { uTime: U.uTime, uCol: { value: pal.grey2 } }, gp = [], gs = [], gi = [], GS = 8;
    for (let st = 0; st < 2; st++) for (let k = 0; k <= GS; k++) { gp.push(-0.5, 0, k / GS, 0.5, 0, k / GS); gs.push(st, st); if (k < GS) { const a = (st * (GS + 1) + k) * 2; gi.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('aStroke', new THREE.Float32BufferAttribute(gs, 1)); gg.setIndex(gi);
    const gull = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: gullU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aStroke; uniform float uTime;
        void main(){
          float t = position.z, sgn = aStroke < .5 ? -1. : 1., flap = sin(uTime * 5.2), span = 3.3;
          vec3 p = vec3(sgn * span * t, span * ((1.05 + .55 * flap) * t - (1. + .25 * flap) * t * t) + position.x * (.46 - .3 * t), .7 * t * t);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: 'uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.); }' }));
    gull.frustumCulled = false; gull.scale.setScalar(0); scene.add(gull);
    const gullP = new THREE.Vector3(), gullT = new THREE.Vector3();
    function moveGull(time, u) {
      const k = rare ? ease((u - (uL1 - 0.03)) / 0.04) : 0; gull.scale.setScalar(k);
      if (k <= 0) return;
      const d = u * path.length + 26 - 6 * Math.sin(time * 0.31);
      path.posAtDist(d, gullP); path.tangentAtDist(d, gullT);
      const off = 1 - ease((u - 0.955) / 0.03), sd = 7.5 * off + 1.1 * Math.sin(time * 0.53);   // to one side and above the centre line, then in through the diamond
      gull.position.set(gullP.x - gullT.z * sd, gullP.y + 0.6 + 3.6 * off + 0.9 * Math.sin(time * 0.71), gullP.z + gullT.x * sd);
      gull.rotation.set(0, Math.atan2(-gullT.x, -gullT.z), 0.22 * Math.sin(time * 0.53 + 1.2));
    }
    await ctx.yield();

    // deliberate pieces seaward of the cross avenue, so the right of the frame in the second lift is never empty:
    // a second shaft with its riders, three long bars, and a far stack of unequal whites
    shaft(236, -437, 44, 238, 13, 0, true, { ns: 2, sw: 4.3, rider: 3.4, per: 16 });
    // (hidden from the sea like the city behind the Tree: from there they were two tall grey strokes beside the crown)
    { const it = bar([205, -1.3, -419], [205, 262, -419], 0.6, lineC(0.2), { ext: 0 }); it.wedge = true; it.bold = true; it.cb = true; } { const it = bar([271, -1.3, -404], [271, 322, -404], 2.4, lineC(0.6), { ext: 0 }); it.wedge = true; it.cb = true; }
    { const it = bar([262, 198.6, -468], [262, 198.6, -384], 0.6, lineC(0.4), { ext: 0 }); it.wedge = true; it.bold = true; it.cb = true; }
    for (let y = 30, k = 0; y < 300; y += 12, k++) items.push({ p: [414 + (k % 4 - 1.5) * 2, y, -408 + (k % 3 - 1) * 2.5], s: [58 - (k % 4) * 5, 0.8, 58 - (k % 3) * 7], c: style.whites[(k * 5 + (k >> 1)) % 3] });
    await ctx.yield();

    // What the sea may see. From the entry the Tree stands against open white: every box that lies behind the crown
    // as seen from there (and any coloured plane that would look bigger than a quarter of the Tree) is left out while
    // we are at sea, by the law that leaves out what is far, and arrives ring by ring as the lift starts.
    // the one diagonal is kept for the exit: a plane of the sky's own white stands between it and the sea, and it is
    // first glimpsed from the avenue, past that plane's edge
    const door = style.boxes([{ p: [0, 0, 0], s: [34, 34, 0.8], c: P.sky, edge: P.sky, keep: true }]); door.position.set(150.5, 145.5, -600); scene.add(door);
    // planes mid-slide beside the second lift, on staggered clocks, so that shaft is never still
    for (let k = 0; k < 6; k++) {
      const c0 = paint(rc()), c = k === 1 ? c1 : (k === 3 ? P.yellow : (k === 4 ? c2 : c0)), yy = [118, 152, 178, 130, 166, 142][k];
      items.push({ p: [258 + k * 5.2, yy, -506 + k * 17], s: [0.8, k % 2 ? 22.4 : 16.4, k % 2 ? 16.4 : 22.4], c, edge: edgeOf(c, rc()), slide: [0, 0, k % 2 ? 32 : -32], phase: (k / 6 + rc() * 0.08) % 1, wedge: true, pln: true });
    }
    // THE SECOND COMPOSITION. What the second lift and the last turn look at, on every colourway: three planes of
    // paint at three depths between the lift and the diamond's side of the city (about 100, 160 and 200 m from the
    // top of the lift), each square to the last avenue, each with one thick black bar that passes it without
    // touching; they are drawn out of one edge while we cross to the lift, and the middle one keeps working like a
    // drawer. Then THE GATE: a tall plane on the left of the last avenue, drawn in as we come out of the turn, so
    // the avenue is first seen between two big planes with the diamond small beyond them, and then the diamond alone.
    {
      const k1 = frontOfU(0.712), k3 = frontOfU(0.718), kg = frontOfU(0.826);   // (the yellow and the far plane are drawn as the second lift starts)
      const pl = (p, sz, c, key, sl, drawer) => { const it = { p, s: sz, c, edge: rim, key, slide: sl, free: true, drawer: !!drawer, pln: true }; items.push(it); COMP.push(it); };
      pl([200, 171, -566], [26, 20, 0.8], c1, k1, [0, 20, 0]); cbar([224, 141, -564], [224, 203, -564], 2.4, k1 + 3, 1, true);
      pl([246, 196, -530], [0.8, 28, 44], P.yellow, frontOfU(0.735), [0, 0, -44], true); cbar([247.6, 162, -503.4], [247.6, 230, -503.4], 2.4, frontOfU(0.735) + 3, -1, true);   // (square to the lift now, 110 m off and high: about a sixth of the frame wide from its top; it is drawn as the lift starts, so it is never cut by the top of the frame from the cross avenue)
      pl([262, 178, -592], [64, 48, 0.8], c2, k3, [0, -48, 0]); cbar([297.4, 146, -590], [297.4, 218, -590], 2.4, k3 + 3, -1, true);   // (64 by 48 and 20 m nearer: a seventh of the frame wide from the lift)
      // and one below them, left of the last avenue, standing on the white ground's side of the picture: the one plane of paint in the calm lower left (seen from the first turn and from the top of the second lift)
      pl([300, 80, -622], [0.8, 36, 60], c1, frontOfU(0.56), [0, 0, 60]); cbar([301.6, 42, -586], [301.6, 120, -586], 2.4, frontOfU(0.56) + 3, 1, true);
      pl([138, 155, -580], [18, 28, 0.8], c2, kg, [18, 0, 0]); cbar([127, 172.4, -578.6], [156, 172.4, -578.6], 2.4, kg + 4, 1, true);   // both planes of the gate are drawn shut into one edge as we come up to them (THE DRAWER'S RULE)
      // THROUGH THE COLONNADE: one plane of paint square to the cross avenue, beyond the second lift and inland of it,
      // seen whole in the opening between the near shaft's strips and the far shaft's; one thick bar passes it
      pl([286, 146, -520], [0.8, 44, 50], c1, frontOfU(0.635), [0, 0, 50]); cbar([287.2, 112, -549], [287.2, 178, -549], 2.4, frontOfU(0.635) + 3, 1, true);   // (ruled out as we come out of the turn)
      // seaward of the cross avenue: one plane of paint behind the tall thick upright that stands there
      items.push({ p: [284, 160, -386], s: [0.8, 44, 60], c: c2, edge: rim, wedge: true, pln: true });
      { const it = bar([330, 190, -470], [330, 190, -250], 2.4, lineC(0.3), { ext: 0 }); it.wedge = true; it.bold = true; it.far = false; it.cb = true; }   // and one long level bar high over the shore
    }
    // NOTHING DOMINATES. A last pass over the scattered planes and bars (a pure test of where each one stands, so the
    // seeded scatter itself is untouched): (1) the last avenue is an open channel 30 m in radius from the turn to
    // beyond the diamond, at every height, so the diamond stands alone against the white cell of its ground; (2) round the second
    // lift, the last turn and the last avenue no plane is wider than about a third of its distance from the cage
    // line (about 15 percent of the frame); (3) seen from the level-off, the city to the right opens as a few clear
    // planes at mid distance: beyond 230 m the scatter keeps to a band round the horizon, nearer than that the
    // small ones are thinned so that white stands between those that stay.
    {
      const EX = [C[4], C[5], C[6], LAST], CH0 = [C[6][0], C[6][1], C[6][2] + 8], VL = [0, Y_AVE, -345], hsh = (p) => { const v = Math.sin(p[0] * 12.9898 + p[1] * 78.233 + p[2] * 37.719) * 43758.5453; return v - Math.floor(v); };
      const exD = (q) => { let d = 1e9; for (let i = 0; i < 3; i++) d = Math.min(d, segDist(q[0], q[1], q[2], EX[i], EX[i + 1])); return d; };
      let w = 0;
      for (let n = 0; n < items.length; n++) {
        const it = items[n]; let dead = false;
        if (it.gen) {
          const p = it.p, sz = it.s, sl = it.slide, big = Math.max(sz[0], sz[1], sz[2]); let dEx = 1e9, dCh = 1e9, sightD = false;
          const ax = [0, 1, 2].sort((u, v) => sz[v] - sz[u]);         // sampled across its two long sides, at rest and slid out
          for (let k = 0; k < (sl ? 3 : 1); k++) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const q = [p[0], p[1], p[2]]; q[ax[0]] += sz[ax[0]] * i * 0.25; q[ax[1]] += sz[ax[1]] * j * 0.25;
            if (sl) { const f = [0, 0.55, 1.08][k]; q[0] += sl[0] * f; q[1] += sl[1] * f; q[2] += sl[2] * f; }
            dEx = Math.min(dEx, exD(q)); dCh = Math.min(dCh, segDist(q[0], q[1], q[2], CH0, LAST));
            // nothing scattered lies between the first avenue and the far square D (a white slab lay over its corner)
            if (q[2] > -533) for (const ez of [-330, -400, -445]) if (q[2] < ez - 4) { const t = (-534.8 - ez) / (q[2] - ez), X = q[0] * t, Y = Y_AVE + (q[1] - Y_AVE) * t; if (X > -74 && X < -2 && Y > 112 && Y < 174) sightD = true; }
          }
          if (dCh < 30) dead = true;
          // CALM BELOW THE SECOND LIFT: left of the cross avenue and under the last one (what the first turn and
          // the top of the second lift look down into) the white ground is left to itself: no scattered bar, no small
          // plane, no pale plane under 58 m, and no rim in another paint (stubs, hairline outlines and ticks from there);
          // nothing scattered stands in the second lift's own shaft either
          if (p[1] < 150 && p[2] < -486 && p[2] > -900 && p[0] > -80 && p[0] < 340) { if (it.gen === 2 || !style.whites.includes(it.c) || big < 58) dead = true; }
          if (p[0] > 108 && p[0] < 215 && p[2] > -522 && p[2] < -440 && p[1] > 60 && p[1] < 158) dead = true;
          if (sightD) dead = true;
          if (it.gen === 1 && sz[0] < 1 && Math.abs(p[0]) < 12 && p[2] < -350 && p[2] > -640 && it.edge && it.edge !== it.c) dead = true;   // a plane edge-on to the first avenue with a painted rim was a hairline of paint down the middle of the view
          // ONE FAMILY OF LINE WEIGHTS: a far bar is drawn at least a pixel and a half wide (the style's far rule), so
          // there must be far fewer of them: two thin scattered bars in three are left out, more far from the course,
          // and a far plane's rim is its own paint (a 0.8 m black rim at 200 m was a hairline)
          { const dP = distPath(p[0], p[1], p[2]); if (it.gen === 2 && sz[ax[1]] < 1 && hsh(p) > (dP > 240 ? 0.16 : 0.34)) dead = true; if (it.gen === 1) it.edge = it.c; }
          // TWO WEIGHTS ON SCREEN: every scattered bar that is kept is held at the bold width on the canvas (about
          // 3.5 px, or its own 2.4 m when that is more) and stands within 300 m of the second lift and the last avenue,
          // so it is black from there; the rest are left out. No hairlines, and no grey line beside the diamond.
          if (it.gen === 2) { const dA = Math.min(Math.hypot(p[0] - C[4][0], p[1] - C[4][1], p[2] - C[4][2]), Math.hypot(p[0] - C[6][0], p[1] - C[6][1], p[2] - C[6][2]), Math.hypot(p[0] - LAST[0], p[1] - LAST[1], p[2] - LAST[2])); if (dA > 300 || Math.hypot(p[0] - C[5][0], p[1] - C[5][1], p[2] - C[5][2]) > 312 || (sz[ax[1]] < 1 && (hsh(p) * 7.13) % 1 > 0.55)) dead = true; else it.bold = true; }   // (and within 312 m of the top of the second lift: from there no bar is grey)
          // THE MIDDLE is the composition's: round the first avenue and the cross avenue most of the thin bars and
          // the small whites are left out, and nothing scattered stands in or against one of its planes
          const dM = Math.min(segDist(p[0], p[1], p[2], C[2], C[3]), segDist(p[0], p[1], p[2], C[3], C[4])), white = style.whites.includes(it.c);
          if (dM < 170 && ((it.gen === 2 && sz[ax[1]] < 1 && hsh(p) > 0.25) || (it.gen === 1 && white && big < 40 && hsh(p) > 0.35))) dead = true;
          for (const K of COMP) { let hit = true; for (let a = 0; a < 3; a++) if (Math.abs(p[a] - K.p[a]) > (sz[a] + K.s[a]) / 2 + 5 + (sl ? Math.abs(sl[a]) : 0)) hit = false; if (hit) dead = true; }
          const dxl = p[0] - VL[0], dzl = VL[2] - p[2], dl = Math.hypot(dxl, dzl, p[1] - VL[1]), right = dxl > 12 && dzl > 0 && dxl < dzl * 1.3;
          if (it.gen === 2) {
            // bars: along the last avenue none runs lengthwise (a bar along the view is a diagonal on screen), no thick
            // bar stands near, and half of the rest are left out; to the right of the level-off they thin like the planes
            if ((dCh < 210 && ax[0] === 2) || (dEx < 80 && sz[ax[1]] > 1) || (dEx < 110 && hsh(p) > 0.45)) dead = true;
            if ((ax[0] === 2 && segDist(p[0], p[1], p[2], C[2], C[3]) < 130) || (ax[0] === 0 && (Math.min(segDist(p[0], p[1], p[2], C[3], C[4]), segDist(p[0], p[1], p[2], C[4], C[5])) < 130 || (p[0] > 40 && Math.abs(p[2] + 476) < 250 && p[2] > -640)))) dead = true;   // nothing lengthwise to the view from the cross avenue and the second lift
            if (right && ((dl > 230 && Math.abs(p[1] - VL[1]) > 0.11 * dl) || (dl > 90 && hsh(p) > 0.4))) dead = true;
          }
          if (it.gen === 1) {
            if (big > 0.33 * dEx + 4) dead = true;
            const dx = p[0] - VL[0], dz = VL[2] - p[2], dist = Math.hypot(dx, dz, p[1] - VL[1]);
            if (dx > 12 && dz > 0 && dx < dz * 1.3) {
              if (dist > 230 && Math.abs(p[1] - VL[1]) > 0.11 * dist) dead = true;
              else if (dist > 90 && dist <= 230 && big < 0.14 * dist && hsh(p) > 0.55) dead = true;
            }
          }
        }
        if (!dead) items[w++] = it;
        if (n % 300 === 299) await ctx.yield();
      }
      items.length = w;
    }
    await ctx.yield();
    // ---------------------------------------------------------------- THE CLEARANCE (a rule in space, for the whole flight)
    // Every bar, column and shaft of the city (the scattered bars, the compositions' bars, the sleepers, the deliberate
    // bars, a shaft's strips with their riders) stands at least 6 m plus fifteen times its own width from the flown
    // line, and never needs more than 42 m: a thin bar 15 m, a thick one and a shaft's strip 42 m (the two distances
    // the scatter itself keeps from the course). The line is taken at even steps of 2.5 m from its
    // first metre to its last; a thing that fails is moved straight away from the nearest point of the line, a step at
    // a time, until it passes. Nothing is removed and no draw is touched. (The design has things 'the nearest 8 m
    // away': this is a departure from it, by order: a bar or a column standing at the lens crowds it.)
    const CLR_MAX = 42;
    {
      const SM = []; for (let d = 0; d <= path.length; d += 2.5) { path.posAtDist(d, pv); SM.push(pv.x, pv.y, pv.z); }
      const dir = [0, 0, 0];
      const nearLine = (p, s) => {      // the nearest sample of the line to an axis box: its distance, and (dir) the way from the line to the box
        let best = 1e18;
        for (let i = 0; i < SM.length; i += 3) {
          const dx = Math.max(0, Math.abs(SM[i] - p[0]) - s[0] / 2), dy = Math.max(0, Math.abs(SM[i + 1] - p[1]) - s[1] / 2), dz = Math.max(0, Math.abs(SM[i + 2] - p[2]) - s[2] / 2), d = dx * dx + dy * dy + dz * dz;
          if (d < best) { best = d; dir[0] = Math.sign(p[0] - SM[i]) * dx; dir[1] = Math.sign(p[1] - SM[i + 1]) * dy; dir[2] = Math.sign(p[2] - SM[i + 2]) * dz; }
        }
        return Math.sqrt(best);
      };
      const units = [], groups = new Map();
      for (const it of items) {
        if (it.sh) { let g = groups.get(it.sh); if (!g) { g = { test: [], all: [] }; groups.set(it.sh, g); units.push(g); } g.all.push(it); if (it.strip) g.test.push(it); }
        else if (it.cb) units.push({ test: [it], all: [it] });
      }
      for (let n = 0; n < units.length; n++) {
        const un = units[n]; if (!un.test.length) continue;
        const sd = un.test[0].s.slice().sort((a, b) => a - b), clr = Math.min(CLR_MAX, 6 + 15 * sd[1]);
        for (let k = 0; k < 80; k++) {
          let d = 1e9, vx = 0, vy = 1, vz = 0;
          for (const it of un.test) { const dd = nearLine(it.p, it.s); if (dd < d) { d = dd; vx = dir[0]; vy = dir[1]; vz = dir[2]; } }
          if (d >= clr) break;
          let l = Math.hypot(vx, vy, vz); if (l < 1e-4) { vx = 0; vy = 1; vz = 0; l = 1; }
          const st = Math.min(clr - d + 0.05, 3) / l;
          for (const it of un.all) { it.p[0] += vx * st; it.p[1] += vy * st; it.p[2] += vz * st; }
        }
        if (n % 50 === 49) await ctx.yield();
      }
    }
    await ctx.yield();
    // ---------------------------------------------------------------- THE STANDING LATTICES
    // A subject for each avenue, built as the city is built: a tall lattice of black bars in the two widths that cross
    // without joining (uprights in front, rails behind, overrunning or stopping short), holding panes of the three
    // whites, a red, a yellow and a blue, one pane working like a drawer. They stand by ONE rule of the city's plan:
    // at the far end of each avenue the course flies along, square to it and astride its line, set back beyond the
    // corner by the thick bar's clearance plus half their own width (the first avenue's and the cross avenue's); and
    // on either side of the last avenue, in the diamond's own plane, set back from the line by the same clearance plus
    // half their own width, with no bar overrunning toward the avenue.
    // Height: seven or eight times the avenue's width (the pair we pass between: five times), centred between the two levels the course flies that avenue at.
    // An avenue runs through an open cell: no pane there, and a rail at its level stops short on either side of it.
    // Each draws itself in, uprights, then rails, then panes, while the eye flies the stretch of the course before its avenue (item.metre, in metres flown): the first bar begins as the eye passes the corner where that stretch begins,
    // and the last pane, drawn like every piece over 16 m of flight, is whole as the eye passes the corner where its avenue begins (for the first: where the level landing of the flown line begins, and the top of the first lift; the first avenue's two ends; the cross avenue's two ends, for the pair). A corner's metre is that of the route's point nearest it in plan.
    // Sizes, colours and the drawer pane come from a fork of their own ('lattice'), taken after every old fork.
    const rl = rng.fork ? rng.fork('lattice') : rng, CLR_T = Math.min(CLR_MAX, 6 + 15 * 2.4);
    const metreOf = function (c) { return path.nearestXZ(c[0], c[2]).u * path.length; };
    const lattice = (o) => {
      const cols = []; for (let i = 0; i < o.cols; i++) cols.push(o.cols === 3 && i === 1 ? rl.pick([18, 24]) : rl.pick(o.colW));
      const W = cols.reduce((a, b) => a + b, 0), nU = rl.pick(o.high), H = nU * o.unit, rows = [];
      for (let left = nU; left > 0;) { const r = Math.min(left, rl.pick([1, 2, 2, 3])); rows.push(r * o.unit); left -= r; }
      const { at, hc } = o.place(W), X = [hc - W / 2], Y = [o.yc - H / 2], d0 = metreOf(o.span[0]), d1 = metreOf(o.span[1]), mine = [];
      for (const c of cols) X.push(X[X.length - 1] + c); for (const r of rows) Y.push(Y[Y.length - 1] + r);
      const P3 = (h, y, d) => (o.xy ? [h, y, at + d] : [at - d, y, h]), S3 = (lh, ly, t) => (o.xy ? [lh, ly, t] : [t, ly, lh]), H3 = (v) => (o.xy ? [v, 0, 0] : [0, 0, v]);
      const put = (it, t) => { it.free = true; it.far = false; it.t = t; mine.push(it); items.push(it); return it; };
      const over = (side) => (side === o.stop ? -rl.range(0.8, 2.2) : (rl.chance(0.3) ? -rl.range(1.2, 2.6) : rl.range(1.5, 5.5)));
      const thickUp = rl.int(0, X.length - 1), thickRail = rl.int(0, Y.length - 1);
      X.forEach((x, i) => {                                           // uprights, growing upward
        const w = i === thickUp ? 2.4 : 0.6, y0 = Y[0] - over(0), y1 = Y[Y.length - 1] + over(0), L = y1 - y0;
        put({ p: P3(x, (y0 + y1) / 2, w > 1 ? 0.9 : 0.5), s: S3(w, L, 0.7), c: lineC(rl()), slide: [0, L, 0], bold: true }, 0.3 * i / X.length);
      });
      Y.forEach((y, j) => {                                           // rails, ruled across from alternate sides
        const w = j === thickRail ? 2.4 : 0.6, cut = o.ave && Math.abs(y - o.ave.y) < 3.5 + w / 2;
        for (const [a0, b0, sa, sb] of (cut ? [[X[0], o.ave.h - 7, -1, 2], [o.ave.h + 7, X[X.length - 1], 2, 1]] : [[X[0], X[X.length - 1], -1, 1]])) {
          const a = a0 - (sa === 2 ? 0 : over(sa)), b = b0 + (sb === 2 ? 0 : over(sb)), L = b - a;
          put({ p: P3((a + b) / 2, y, w > 1 ? -0.5 : -0.1), s: S3(L, w, 0.7), c: lineC(rl()), slide: H3(j % 2 ? -L : L), bold: true }, 0.3 + 0.3 * j / Y.length);
        }
      });
      const cells = []; for (let i = 0; i + 1 < X.length; i++) for (let j = 0; j + 1 < Y.length; j++) if (!(o.ave && o.ave.h > X[i] && o.ave.h < X[i + 1] && o.ave.y > Y[j] - 1 && o.ave.y < Y[j + 1] + 1)) cells.push([i, j]);
      rl.shuffle(cells); const nP = Math.min(cells.length, Math.max(4, Math.round(cells.length * 0.62))), paints = rl.shuffle([P.red, P.yellow, P.blue]), dr = rl.int(0, nP - 1);
      for (let n = 0; n < nP; n++) {                                  // panes, stopping short of the bars: the three paints first, then whites and now and then a paint
        const i = cells[n][0], j = cells[n][1], c = n < 3 ? paints[n] : (rl.chance(0.25) ? rl.pick(paints) : style.whites[rl.int(0, 2)]), r3 = rl(), horiz = rl.chance(0.6), sg = rl.chance(0.5) ? 1 : -1;
        const lh = X[i + 1] - X[i] - 3.6 - (r3 < 0.25 ? 3 : 0), ly = Y[j + 1] - Y[j] - 3.6 - (r3 > 0.75 ? 3 : 0);
        put({ p: P3((X[i] + X[i + 1]) / 2, (Y[j] + Y[j + 1]) / 2, -1.2 - 0.03 * n), s: S3(lh, ly, 0.3), c, edge: c, slide: horiz ? H3(sg * lh) : [0, sg * ly, 0], drawer: n === dr, pln: true }, 0.6 + 0.4 * n / nP);
      }
      mine.forEach(function (it) { it.metre = d0 + (d1 - d0 - 16) * it.t / mine[mine.length - 1].t; });
    };
    lattice({ xy: true, cols: 3, colW: [12, 18], high: [7, 8], unit: AVE[0].w, yc: Y_AVE, stop: null, ave: { h: C[3][0], y: AVE[0].y }, span: [CP[8], C[2]], place: (W) => ({ at: C[3][2] - (CLR_T + W / 2), hc: C[3][0] }) });
    lattice({ xy: false, cols: 3, colW: [12, 18], high: [7, 8], unit: AVE[1].w, yc: (Y_AVE + Y_TOP) / 2, stop: null, ave: { h: C[6][2], y: AVE[1].y }, span: [C[2], C[3]], place: (W) => ({ at: C[6][0] + CLR_T + W / 2, hc: C[6][2] }) });
    // (the pair we fly between: five times the avenue's width tall and narrow, two columns of 9 to 15 m)
    for (const sd of [-1, 1]) lattice({ xy: true, cols: 2, colW: [9, 12, 15], high: [5], unit: AVE[2].w, yc: Y_TOP, stop: -sd, ave: null, span: [C[3], C[6]], place: (W) => ({ at: PORTAL[2], hc: PORTAL[0] + sd * (CLR_T + W / 2) }) });
    await ctx.yield();
    // ---------------------------------------------------------------- THE DRAWER'S RULE, given by size
    // Every plane of paint of the city whose larger side is 16 m or more (the scattered planes, the compositions',
    // the ground paints, the lattices' panes: item.pln, a flag set by size, not by a list), and the two far planes of
    // the opening (item.seaOut), begin to draw shut into one edge when the lens comes within 2.6 times that side,
    // have clicked shut at 1.8 times, and open again behind us by the same rule (style item.near): the same two
    // numbers for every plane. A plane shuts into the end of its long side that lies farther from the course.
    // (The exit's own white ground, its lines and fields and the drawers beside it are the diamond's, not the city's: this rule is not asked of them; the opening's three near
    // planes stand as they stood.)
    for (const it of items) if (it.seaOut || (it.pln && Math.max(it.s[0], it.s[1], it.s[2]) >= 16)) {
      const ax = it.s[0] >= it.s[1] && it.s[0] >= it.s[2] ? 0 : (it.s[1] >= it.s[2] ? 1 : 2), a = it.p.slice(), b = it.p.slice(); a[ax] -= it.s[ax] / 2; b[ax] += it.s[ax] / 2;
      it.near = true; it.nearPos = distPath(b[0], b[1], b[2]) > distPath(a[0], a[1], a[2]);
    }
    await ctx.yield();
    let nIt = 0;
    for (const it of items) {
      if (++nIt % 500 === 0) await ctx.yield();
      if (it.free) continue;
      if (it.wedge) { it.keep = false; continue; }
      const p = it.p, sz = it.s, sl = it.slide; let inW = false;
      if (p[2] < -352) for (let i = 0; i < 5 && !inW; i++) {
        const x = i === 4 && sl ? p[0] + sl[0] : p[0] + (i & 1 ? 0.5 : -0.5) * sz[0], z = Math.min(-1, i === 4 && sl ? p[2] + sl[2] : p[2] + (i & 2 ? 0.5 : -0.5) * sz[2]), ax = x / -z;
        if (ax > -0.5 && ax < 0.35) inW = true;
      }
      const app = Math.max(sz[0], sz[1], sz[2]) / Math.hypot(p[0], p[1] - Y_SEA, p[2]);
      if (inW || (!it.far && !style.whites.includes(it.c) && app > 0.13)) { it.wedge = true; it.keep = false; }
      else if (!style.whites.includes(it.c) && -304 - p[2] > 20 && p[0] / (-304 - p[2]) > 0.3 && p[0] / (-304 - p[2]) < 1.12 && Math.abs(p[1] - 95) / (-304 - p[2]) < 0.24) { it.wedge = true; it.keep = false; }   // a plane of paint that stood behind the one large limb as seen from the second flight (u 0.40): it arrives with the city, and the limb in the act stands against white
      else if (it.gen === 2) { it.wedge = true; it.keep = false; }   // from the sea and the rise the city is planes, with no scattered bar: they arrive with the city at the level-off
      else if (p[2] < -352 && p[0] / -p[2] <= -0.5) it.left = true;      // left of the Tree: seen from the sea, drawn shut while the lift rises
      // (from the sea the far city stands behind the Tree as pale blocks, white on white: the depth of the plain.)
    }
    await ctx.yield();
    for (let i = 0; i < items.length; i += 1500) { scene.add(style.boxes(items.slice(i, i + 1500))); await ctx.yield(); }   // a few draw calls, so no step is long
    const camPos = new THREE.Vector3(), camDir = new THREE.Vector3(), poiV = new THREE.Vector3(), poiW = new THREE.Vector3(), poiOff = new THREE.Vector3(0, -14, -100), poiOff2 = new THREE.Vector3(100, -14, 0);
    const gazeP = new THREE.Vector3(), gazeD = new THREE.Vector3(), dTop2 = path.nearestXZ(C[5][0], C[5][2]).u * path.length, lift2 = (Y_TOP - Y_AVE) / Math.sin(LIFT);
    const gazeAt = (time, u) => {
      const L = path.length, d = Math.min(u * L, L - 0.5);
      path.posAtDist(d, gazeP);
      const la = 30 + 8 * ease(1 - Math.abs(d - dTop2) / lift2);        // it looks 8 m further on round the top of the second lift: rising over the second lift's own length of course before its top, falling over the same length after
      if (d + la < L) path.posAtDist(d + la, gazeD).sub(gazeP); else path.tangentAtDist(L - 1, gazeD);
      gazeD.y = 0; if (gazeD.lengthSq() < 1e-8) gazeD.set(0, 0, -1);
      return gazeP.addScaledVector(gazeD.normalize(), 400);
    };
    const sL = Math.sin(LIFT), dF0 = (Z_START - Z_UP) + (Y_MID - Y_SEA) / sL + (Z_UP - (Y_MID - Y_SEA) / tl - Z_UP2), dF1 = dF0 + (Y_LAND - Y_MID) / sL, dG0 = dLift1 + Z_START - (Y_AVE - Y_LAND) / sL;   // the two flights of the first lift, as arc lengths
    const uF0 = uOfDist(dF0 + 1), uF1 = uOfDist(dF1 - 6), uG0 = uOfDist(dG0 - 5);
    const uTrunk = 0.172, uL00 = uOfDist(-Z_UP - 12), uL0p = uOfDist(dLift0 + 1), uL0 = uOfDist(dLift0 - 12), uL1 = uOfDist(dLift1 - 6), uM0 = path.nearestXZ(C[4][0] - 8, C[4][2]).u, uM1 = path.nearestXZ(C[5][0] + 6, C[5][2]).u;
    const uT1 = path.nearestXZ(C[3][0] + 6, C[3][2] + 6).u, uT2 = path.nearestXZ(C[6][0] - 5, C[6][2] - 5).u;
    return {
      scene, path, duration: 40,
      camera: { fov: 60, near: 0.3, far: 6000, lookAhead: 24, sway: 0, bank: 0 },
      pois: [
        // the camera obeys the law too: it looks along an axis. The only pulls are level ones, straight ahead,
        // which keep the gaze near level in the two lifts so that uprights stay upright
        // The gaze is level and follows the route's heading 30 m ahead: ONE pull of weight 1, which the sweeping camera
        // lands on exactly. (The engine has no camera option that keeps a gaze level; the steady camera gets what the
        // engine gives it: about a third of this pull, so in the two lifts it tips up by some thirty degrees.)
        { at: gazeAt, from: -1, to: 2, fade: 0.01, weight: 1 },
      ],
      portal: { shape: 'circle', radius: 9.3, color: '#ffffff', glow: 0.12, halo: false, style: 'ring', revealDistance: 300 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(camPos); camera.getWorldDirection(camDir);
        style.update(dt, time, camera); sky.follow(camera);
        shoreU.uWave.value = camPos.z - 34 - 2.4 * Math.max(0, camPos.y - Y_SEA);
        hero.setTrunk((u - uTrunk) / 0.009);
        const hCage = (camPos.y - TREE[1]) + TILT * (camPos.z - TREE[2]) + 1;
        hero.setFront(u < uL00 ? -1e4 : (u < uL1 ? hCage : Math.max(hCage, 112 + (u - uL1) / 0.11 * 190)));
        U.uPart.value = (u - (uL0 + 0.012)) / 0.04;                                 // what stands between the lift and the trunk draws aside
        hero.update(dt, time, camera);
        moveBirds(time, u); moveClouds(time, u); moveGull(time, u); rulePier(u);
        { const w = (time * 6.5) % 170; cage2.position.y = 112 + w * 0.42; cage2.scale.setScalar(secondCage ? 2.2 * ease(w / 6) * ease((170 - w) / 6) : 0); }
        // the city behind the Tree is left out while we are at sea, and arrives ring by ring as the lift starts
        const arrive = Math.pow(ease((u - (uL1 - 0.03)) / 0.085), 2);
        door.position.y = 145.5 - 50 * ease((u - (uL1 - 0.005)) / 0.035);      // the sky-white plane draws down like a lift and the diamond can be glimpsed
        { const hi = ease((u - (uL1 + 0.025)) / 0.05); dashU.uSeaHi.value = 0.8 * hi; for (let i = 1; i < 3; i++) duneMat[i].uniforms.uCol.value.lerpColors(duneCol[i], duneCol[0], hi); }
        U.uLate.value = ease((u - 0.548) / 0.02); U.uUndo.value = ease((u - 0.535) / 0.05);
        U.uShut.value = ease((u - uL0) / 0.035) * (1 - ease((u - (uL1 - 0.005)) / 0.06));
        U.uFlown.value = u * path.length;
        U.uCutW.value = 110 + 3200 * arrive; U.uCut.value = fog ? 330 + 3000 * arrive : 1e9;
        // the plate: square to the view, low under the lens, and never still against the frame
        camera.matrixWorld.decompose(cageP, cageQ, cageS);
        const inLift = ease((u - uF0) / 0.02) * (1 - ease((u - uF1) / 0.02)) + ease((u - uG0) / 0.013) * (1 - ease((u - uL1 + 0.02) / 0.03)) + ease((u - uM0) / 0.02) * (1 - ease((u - uM1 + 0.012) / 0.02));
        const inTurn = Math.exp(-Math.pow((u - uT1) / 0.022, 2)) - Math.exp(-Math.pow((u - uT2) / 0.022, 2));
        const dip = Math.pow(Math.max(0, Math.sin(time * 0.37 + 1.1)), 6);
        plateOff.set(0.62 * Math.sin(time * 0.43) + 0.2 * Math.sin(time * 1.07 + 2) - 1.5 * inTurn + 1.1 * Math.min(1, inLift),
          -4.4 + 1.9 * Math.min(1, inLift) + 0.1 * Math.sin(time * 1.3) + 0.05 * Math.sin(time * 2.9) - 0.16 * inLift - 0.3 * dip, -5.2).applyQuaternion(cageQ);
        cage.matrix.compose(cageP.add(plateOff), cageQ, ONE); cage.matrixWorldNeedsUpdate = true;
        weight.position.x = 0.66 - 0.96 * Math.min(1, Math.max(0, (camPos.y - Y_SEA) / (Y_TOP - Y_SEA)));
      },
      dispose() {},
    };
  },
};
