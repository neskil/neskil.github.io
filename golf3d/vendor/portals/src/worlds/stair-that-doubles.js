// THE STAIR THAT DOUBLES. A clear night in a dark valley and one stone stair in which every step is twice the one before,
// a made thing of lit paper on each tread. Ink and lit paper under a night sky: five stuffs and no others (night, stone, lit
// paper drawn on in ink, gold, vermilion), all from the one style kit of src/parts/stair-that-doubles.js.
// THE STONE is drawn by one law on every face of the stair (courses a twelfth of the step's rise), with ONE COURSE BY PLACE: the top course
// of the wall of riser 9, under the balustrade, is one long coping stone, no upright joint and one shade (the part's COPING).
//
// THE SPEED. The flown line's speed is the 0.43 power of our distance from the stair's foot (on all three axes), so beside a
// step twice as large we fly about a third faster (2 to the 0.43 is 1.35): under three metres a second over the candle,
// twelve through the viaduct's arch, fourteen over the wall of riser 9. It is held within 0.35 and 2.5 of the mean, to the place
// over that wall; from there to the west door it eases to the mean, and from the door to the rose it IS the mean: we slow over
// the forecourt, come in at the west door at the mean and go down the nave unhurried.
// THE FLIGHT is the part's flownLine(): up the stair's middle (z 0) to the ship's mastheads, then low over tread 8's
// paving, through the viaduct's arch next left of its middle pier, up over the top of the wall of riser 9, over the forecourt
// and in at the west door to the rose: 461 m in DURATION seconds (a mean of 7.69 m/s), no bank, look
// ahead 6 m, a lens of FOV degrees (one number: the camera's, and the gaze's hold), and one gaze law to the west door (0.827
// of the flight, weight 0.8). The line as flown is a curve through the part's points: it dips to 2.33 m at x -2 (the level
// run in is 2.4); it is at the nave's level, 128.0, from the west door to the rose. THE FIRST PICTURE HOLDS from the entry to the
// river's far bank (x -14): the whole built stair, from the candle's step to the cathedral's tower tops, the crane and the
// dotted line, stands in the picture with the water under it; then the gaze lowers and from x -10.5 rests on the line of the
// things' middles (through the foot, rising 0.355 in 1) at the point 0.6 of our x plus 3.5 m ahead of us, to the mastheads;
// from there it looks up at the west front, over the viaduct and then over the wall, and comes down to the rose across the
// forecourt (the law stands at the flight's block). Route metres drive the gaze and the pace only.
// WHAT READS THE EYE OR THE LENS, all of it: (1) the sky dome follows the eye. (2) FOOTPRINT FILTERS, each by the size of a
// pixel where it draws: the valley floor's grass marks and the river's wave lines (self similar octaves, dissolved under two
// pixels); the kit's stone joints (the same; in the nave's room of stone each of the two families of joints, and the blocks' own shade,
// by its own breadth in the picture); the kit's ribbons of ink, held between 1.6 and 5 pixels broad and paler when
// thinner; fine ink's least pixel; the joints of the viaduct's paper blocks (joint ink: a pixel broad at the least, paler as its true breadth falls
// under 0.7 of a pixel and gone under 0.35); the dotted lights' least size (1.7 pixels in radius); the stars' size, 2 to 4 pixels by
// the picture's height; the moon's ink (its rim never under 1.6 pixels broad and paler when finer, its blots' edges a pixel
// soft: a pixel's breadth on the moon by the picture's height and the camera's own lens). (3) THE LAW OF SIGHT (the kit's SIGHT). What is
// read: the eye's PLACE and nothing else (not where the eye looks, not the picture's edges, no clock, no memory, no lens, no seed, no still's
// position). What follows: which of the stair's cut numbers are drawn. A number shows its gold and its cut's dark edge only while the whole of
// it stands in sight of that place over THE NEARER STEPS AND THE VIADUCT, whether or not it is in the picture. The steps: two sight lines run from the eye to the two lower
// corners of the number's box, and their CLEAR is the least height by which they pass over the top of every nearer step where they are over
// it (least, as a rule, over the front edge of its tread, or over its side). Clear at or under 0 (a nearer step would cut the number): it is not drawn at all,
// and its riser is plain stone. THE BAND: from 0 up to a sixteenth of the number's own height of clear it comes whole, never in part, from
// the stone to its gold; over that it stands as cut. In metres of clear over the step's edge: 1.75 mm for the number 1, 3.5 mm for 2, 7 mm for
// 4, 14 mm for 8, 28 mm for 16, 56 mm for 32, 0.112 m for 64, 0.224 m for 128, 0.448 m for 256, 0.625 m for 512, for 1024 and for 2048. One
// law for every number, the same on every seed, pace and setting. The viaduct, for the three numbers behind it (512, 1024, 2048): a plain box
// by its own figures and a metre more every way, 192.9 to 202.9 m along the stair, from its tread at 51.1 m up to 101.9 m (a metre over its
// gatehouses' ridges), 57 m to either side of the middle; a number any part of whose box that box would hide from the eye's place is not
// drawn, and it comes whole over 2 m of clear past the box's edge (the box's own band, broader than the steps': the box's end crosses a far
// number sideways and fast). Only the nearer steps and the viaduct are counted, no other thing; the stair is as built: no step, riser or body
// is moved, shrunk or hidden; only the gold with its dark edge comes and goes.
// Nothing else: patches, ink and gold lie over their sheets by a fixed step of the depth buffer a
// layer (the kit), which reads neither the eye's place nor the lens and moves nothing in the picture.
// TIME. update() reads time only (a frame at dt 0 changes nothing); nothing is made in update; no lights.
// BY SEED, everything a seed changes. The brief's variations: the moon's side; the clouds' number (3 or 4), drift and
// scallops; the paper's white; the ridges' outlines (and the ink trees on them); the river's bends; the ship's sail set; the
// town (its houses' breadths, kinds and heights, and which windows are lit). The hand's own: where each blade of grass stands
// and how it sways; each moth's and each bird's ring and beat; each lantern's bearing and phase; each stroke on the water; the heights of the scaffold's pole
// tops; the swell and the overshoot of every ink line. The stair, its law, the things, the numbers, the flown line, the
// gaze and the night do not change. The hour is not dealt and the brief names no rare event, so ctx.vary.hour, rare and density change nothing;
// ctx.quality.detail thins grass and town.
import * as THREE from 'three';
import { makePath, smoothstep, clamp, bell } from '../kit/core.js';
import { buildHero, makeStyle, flownLine, flownMarks, poolAt, treeLines, GLSL_COMMON, FR, POOL, CATH, DOOR_X, ROSE_X, NAVE_Y, KBUILT, halfWidth, thingX, rise, riserX, treadTop } from '../parts/stair-that-doubles.js';

const PALETTE = ['#16246B', '#0E1540', '#5E6C96', '#AEB9D6', '#F4EFE2', '#F2C14E', '#E2452B'];
const RIVER_X0 = -40, RIVER_X1 = -14;                 // the paper river before the foot, at the stair's line
const DURATION = 60;                                   // the flight's time, s: its mean speed is its length over this
const FOV = 62;                                        // the world's own lens, degrees upright: the camera's, and the gaze's hold of the first picture

export default {
  id: 'stair-that-doubles',
  name: 'The Stair That Doubles',
  category: 'bizarre',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = ctx.quality && ctx.quality.detail ? ctx.quality.detail : 1;
    const style = makeStyle(ctx, { palette: PALETTE });
    const P = style.palette, U = style.uniforms;
    scene.background = P.indigo.clone();
    await ctx.yield();
    // the hero: the whole stair and its eleven things, in the brief's axes as the world's own
    const hero = await buildHero(ctx, { style, palette: PALETTE, detail });
    hero.object.rotation.y = -Math.PI / 2; hero.object.updateMatrixWorld(true); scene.add(hero.object);
    await ctx.yield();
    const rv = ctx.rng.fork ? ctx.rng.fork('stair-valley') : ctx.rng;      // the valley's own draws: ridges, river, clouds, grass, moths

    // ---------------------------------------------------------------- NIGHT: the dome, its stars and the one moon
    // THE MOON'S PLACE: 20 degrees up and 38 degrees to the seed's side of the stair's line, either side alike. There no stone of
    // the built stair stands before it at any place on the line from the entry to the ship's mastheads (the stair's own breadth
    // is under 31 degrees out from there, the half built step's stone under 19 degrees up), and it stands whole in the first
    // picture at 16:9 and wider, its rim 0.87 of the way from the picture's middle to its top. Its place, not a switch.
    const side = style.moonSide, az = 38 * Math.PI / 180, el = 20 * Math.PI / 180;
    const moonDir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), side * Math.cos(el) * Math.sin(az));
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), style.sky(moonDir));
    sky.scale.setScalar(5200); sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky'; scene.add(sky);
    await ctx.yield();

    // ---------------------------------------------------------------- THE VALLEY FLOOR AND THE PAPER RIVER (one flat sheet at y 0)
    // Night's two blues and ink, nothing else: indigo grass floor with cut marks of grass in self similar octaves (every octave
    // drawn alike, four times the last, chosen by the pixel's footprint), paler where a thing's pool of light falls on it;
    // the river a band of the other blue from x -40 to x -14 at the stair's line (its bends by seed, none at the line itself),
    // ink wave lines sliding along it, an ink line at each bank.
    const bendA = rv.range(5, 11) * (rv.chance(0.5) ? 1 : -1), bendL = rv.range(0.012, 0.022), bendP = rv.range(0, 6.28), bendB = rv.range(10, 26) * (rv.chance(0.5) ? 1 : -1);
    const riverBend = (z) => bendA * (Math.sin(z * bendL + bendP) - Math.sin(bendP)) + bendB * (Math.sin(z * 0.0031 + 1.7) - Math.sin(1.7));
    const pools = []; for (let k = 0; k <= 10; k++) pools.push(new THREE.Vector4(POOL[k].foot[0], POOL[k].foot[1], POOL[k].foot[2], POOL[k].reach));
    const floorMat = new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uIndigo: { value: P.indigo }, uNight: { value: P.night }, uInk: { value: P.ink }, uPale: { value: P.stoneLit },
        uBend: { value: new THREE.Vector4(bendA, bendL, bendP, bendB) }, uPool: { value: pools } },
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec3 vP;
        void main() { vec4 w = modelMatrix * vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uIndigo, uNight, uInk, uPale; uniform vec4 uBend; uniform vec4 uPool[11];
        varying vec3 vP;
        ${GLSL_COMMON}
        float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba * t); }
        // one octave of grass: a tuft of three cut blades in most cells of a grid of s metres, lying along the stair's line
        float tufts(vec2 p, float s, float fp) {
          vec2 q = p / s, c = floor(q), f = fract(q); float id = h2(c + s);
          vec2 b = vec2(.2 + .3 * h2(c + 1.7), .3 + .4 * h2(c + 5.1)); float l = .26 + .2 * id;
          float d = min(seg(f, b, b + vec2(l, -.11)), min(seg(f, b, b + vec2(l * 1.25, .01)), seg(f, b, b + vec2(l * .9, .13))));
          float w = max(.022, .75 * fp / s), e = fp / s * .6;
          return (1. - smoothstep(w - e, w + e, d)) * step(.25, id) * clamp(.03 / max(fp / s, 1e-5), 0., 1.);
        }
        // one octave of the river's ink: rows of scalloped wave strokes, broken, sliding along the river
        float waves(vec2 p, float s, float fp) {
          float row = floor(p.x / s), fy = fract(p.x / s), hr = h2(vec2(row, s));
          float z = (p.y + uTime * (.5 + .9 * hr) * (hr > .5 ? 1. : -1.) * sqrt(s)) / s + hr * 17.;
          float d = abs(fy - .34 - .26 * abs(sin(z * 1.9)));
          float on = smoothstep(-.25, .05, sin(z * .47 + hr * 6.28) * .5 + .5 * sin(z * .19 + hr * 40.));
          float w = max(.075, .8 * fp / s), e = fp / s * .6;
          return (1. - smoothstep(w - e, w + e, d)) * on * clamp(.09 / max(fp / s, 1e-5), 0., 1.);
        }
        void main() {
          vec2 p = vP.xz; vec2 fw = fwidth(p); float fp = max(max(fw.x, fw.y), 1e-5);
          float lv = clamp(log2(fp * 26.) * .5, 0., 5.99), j = floor(lv), t = lv - j, s0 = exp2(2. * j), s1 = s0 * 4.;
          float bend = uBend.x * (sin(p.y * uBend.y + uBend.z) - sin(uBend.z)) + uBend.w * (sin(p.y * .0031 + 1.7) - sin(1.7));
          float xr = p.x - bend, e = fp * .7;
          float river = smoothstep(${RIVER_X0.toFixed(1)} - e, ${RIVER_X0.toFixed(1)} + e, xr) * (1. - smoothstep(${RIVER_X1.toFixed(1)} - e, ${RIVER_X1.toFixed(1)} + e, xr));
          // the pools of light the things lay, falling off the treads onto the grass (the same sum the stone does)
          float pool = 0.;
          for (int k = 0; k < 11; k++) {
            vec4 q = uPool[k]; vec3 dp = vP - q.xyz; dp.y *= .8; float fk = float(k), bt = beatOf(fk) * beatAmp(fk) * 4.;
            float pf = max(0., 1. - length(dp) / max(q.w * (.7 + 10. * (breathOf(fk) - 1.) + .3 * bt), 1e-3)); pool = max(pool, pf * pf * (3. - 2. * pf));
          }
          float g = mix(tufts(p, s0, fp), tufts(p, s1, fp), t) * (1. - river);
          vec3 col = mix(uIndigo, uNight, .45 * pool);
          col = mix(col, mix(uNight * 1.35, uPale, pool), g * .9);
          vec2 pr = vec2(xr, p.y);
          float wv = mix(waves(pr, s0 * .9, fp), waves(pr, s1 * .9, fp), t);
          vec3 rc = mix(uNight, uInk, wv);
          col = mix(col, rc, river);
          float bw = max(.09, fp * .9), bank = 1. - smoothstep(bw - e, bw + e, min(abs(xr - ${RIVER_X0.toFixed(1)}), abs(xr - ${RIVER_X1.toFixed(1)})));
          col = mix(col, uInk, bank * .9);
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    // the sheet is cut in a grid that doubles outward from the river (4 m squares there, kilometres at the rim): a single
    // sheet of two triangles 14 km long loses its depth near the eye on some machines, and the strokes on the water with it
    const gx = [], gp = [], gi = []; for (const o of [9000, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4]) gx.push(-o); gx.push(0); for (let i = 11; i >= 0; i--) gx.push(-gx[i]);
    for (let i = 0; i < gx.length; i++) for (let j = 0; j < gx.length; j++) gp.push(-24 + gx[i], 0, gx[j]);
    for (let i = 0; i < gx.length - 1; i++) for (let j = 0; j < gx.length - 1; j++) { const a = i * gx.length + j, b = a + gx.length; gi.push(a, a + 1, b + 1, a, b + 1, b); }
    const floorGeo = new THREE.BufferGeometry(); floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); floorGeo.setIndex(gi);
    const floor = new THREE.Mesh(floorGeo, floorMat); floor.renderOrder = -5; floor.frustumCulled = false; floor.name = 'valley floor'; scene.add(floor);
    await ctx.yield();

    // ---------------------------------------------------------------- THE RIDGES: five flat sheets of night, one behind another
    // Folded arcs about the foot, each twice as far as the last (300 m to 4,800 m) and standing higher in the picture, indigo
    // growing bluer with distance, the crest a brush line, ink trees drawn on the face as the stair's own trees are cut (a leaf-
    // shaped crown with its vein on a trunk, round or poplar: the kit's treeLines). They stand outside the stair's own wedge
    // and never nearer than 250 m to its line. Their outlines go by seed.
    const DEG = Math.PI / 180, ridgeCard = style.card(20, 0, 1, 3);       // k 20: the beat never reaches it
    const RH = [28, 75, 190, 470, 1100], RT = [0.34, 0.5, 0.68, 0.84, 1];
    for (let j = 0; j < 5; j++) {
      const R = 300 * 2 ** j, H = RH[j], col = P.indigo.clone().lerp(P.night, RT[j]), a0 = Math.max(38, Math.asin(Math.min(1, 262 / R)) / DEG), a1 = 126;
      for (const s of [-1, 1]) {
        const p1 = rv.range(0, 6.28), p2 = rv.range(0, 6.28), p3 = rv.range(0, 6.28), f1 = rv.range(0.07, 0.11), f2 = rv.range(0.19, 0.27), f3 = rv.range(0.43, 0.6);
        const hgt = (a) => H * (0.52 + 0.24 * Math.sin(a * f1 + p1) + 0.15 * Math.sin(a * f2 + p2) + 0.09 * Math.sin(a * f3 + p3)) * (0.12 + 0.88 * smoothstep(a0, a0 + 9, a));
        const step = 5.5, n = Math.ceil((a1 - a0) / step);
        for (let i = 0; i < n; i++) {
          const ta = a0 + (a1 - a0) * i / n, tb = a0 + (a1 - a0) * (i + 1) / n;
          const A = [R * Math.cos(ta * DEG), 0, s * R * Math.sin(ta * DEG)], B = [R * Math.cos(tb * DEG), 0, s * R * Math.sin(tb * DEG)], L = Math.hypot(B[0] - A[0], B[2] - A[2]);
          const fr = FR.of(A, [B[0] - A[0], 0, B[2] - A[2]], [0, 1, 0]), crest = [];
          for (let q = 0; q <= 6; q++) crest.push([L * q / 6, hgt(ta + (tb - ta) * q / 6)]);
          ridgeCard.sheet(fr, [[0, -1], [L, -1], ...crest.slice().reverse()], { col, layer: 1 });
          ridgeCard.ink(fr, crest, 0.012 * R, { exact: true });
          if (j > 0) for (let t = 0; t < 2; t++) {                           // two ink trees to a fold, standing on the face under its crest
            const u = L * (0.22 + 0.5 * t + rv.range(-0.08, 0.08)), top = hgt(ta + (tb - ta) * u / L), h = H * rv.range(0.3, 0.42), round = rv.chance(0.5), v = (top - 1.1 * h) * rv.range(0.25, 0.9);
            if (v < 0) continue;
            const tl = treeLines(h, h * (round ? 0.7 : 0.32), round), at = (pts) => pts.map((q) => [u + q[0], v + q[1]]);
            ridgeCard.ink(fr, at(tl.outline), 0.0045 * R, { closed: true }); ridgeCard.ink(fr, at(tl.vein), 0.004 * R, { exact: true }); for (const br of tl.branches) ridgeCard.ink(fr, at(br), 0.0035 * R, { exact: true });
          }
        }
      }
      await ctx.yield();
    }
    const ridges = ridgeCard.mesh(0); ridges.frustumCulled = false; ridges.renderOrder = 1; ridges.name = 'ridges'; scene.add(ridges);
    await ctx.yield();

    // ---------------------------------------------------------------- THE MOON'S PATH ON THE RIVER: thin brush strokes of paper white
    // Drawn strokes placed in the world, on the water where the moon's light would lie for an eye on the first PATH_FROM metres of
    // the flown line (x -40 to -34): between the two lines drawn from those two places at the moon's own bearing, to the moon's
    // side, and a little beyond them. Each stroke lies across the stair's line and is one brush mark, full at its middle and
    // thinning to a point at either end; rows half a metre apart from bank to bank, two strokes to a row by the far bank and
    // up to five by the near, the path 6 m broad there and 11 m here: many and narrow, widening toward us. No stroke is broader
    // than an eighth of its length. All are paper white: there is no gold on the water. They wobble as water does and take the
    // breath of the highest built step.
    const refl = style.card(KBUILT, 0, 0.1, 0.07), wob = [], whiteInk = P.paper.clone().multiplyScalar(0.92), tanAz = Math.tan(az), PATH_FROM = 6;
    for (let i = 0; i < 6; i++) wob.push(refl.motion({ kind: 4, axis: [0, 0, 1], amp: 0.10 + 0.03 * i, freq: 0.9 + 0.23 * i, phase: i * 1.3, flutDir: [1, 0, 0], flutFreq: 1.4 + 0.3 * i, flutPhase: i * 2.1 }));
    const stroke = (x, zc, half, w, m) => {
      // a stroke is a slat leaning back at 45 degrees, so that it keeps its breadth to an eye low over the water (as ink it is
      // never drawn over 5 pixels broad, however near): two tapering halves from its middle
      for (const s of [-1, 1]) { const pts = [], n = Math.max(2, Math.round(half / 0.45)); for (let q = 0; q <= n; q++) pts.push([zc + s * half * q / n, 0]);
        let q = 0; refl.ink(FR.of([x, 0.13, 0], [0, 0, 1], [1, 1, 0]), pts, w, { col: whiteInk, layer: 3, m, taper: true, flut: () => (q++ % 2 ? 0.04 : -0.04) }); }
    };
    for (let row = 0, x = RIVER_X1 - 0.8; x > RIVER_X0 + 0.5; row++, x -= 0.5) {
      const t = (RIVER_X1 - x) / (RIVER_X1 - RIVER_X0), W = PATH_FROM * tanAz / 2 + 0.6 + 2.6 * t, n = 2 + Math.floor(3 * t + rv() * 0.9);
      for (let i = 0; i < n; i++) {
        const half = Math.min(W, (0.75 + 1.2 * rv()) * (0.7 + 0.8 * t)), w = Math.min(half / 4, 0.07 + 0.06 * t), off = (W - half) * (2 * rv() - 1);
        const zc = side * (x - RIVER_X0 - PATH_FROM / 2) * tanAz + off; stroke(x + riverBend(zc) + 0.3 * (rv() - 0.5), zc, half, w, wob[(row + i * 2) % 6]);
      }
    }
    const reflMesh = refl.mesh(1); reflMesh.renderOrder = 26; reflMesh.name = 'river strokes'; scene.add(reflMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- CUT PAPER GRASS from the bank to the foot and round it
    // Blades 0.2 to 0.5 m, swaying; dark as the night where no light falls, pale in the candle's pool and the pools of the
    // things beside them. By place they keep clear of the flown line: under the line itself no blade is over 0.25 m.
    const grass = style.card(20, 0, 1, 0.012), sway = [];
    for (let i = 0; i < 12; i++) sway.push(grass.motion({ kind: 0, flutDir: [rv.range(-0.02, 0.02), 0, 0.05 + 0.02 * rv()], flutFreq: 1.1 + 0.9 * rv(), flutPhase: rv.range(0, 6.28), flutBias: 0.5 }));
    const darkBlade = P.night.clone().multiplyScalar(1.25), paleBlade = P.paper.clone().multiplyScalar(0.8), bladeCol = new THREE.Color();
    const litAt = (x, z) => { let f = 0; for (let k = 0; k <= 6; k++) f = Math.max(f, poolAt(x, 0, z, POOL[k].foot, POOL[k].reach * 1.7)); return f; };
    const inStair = (x, z) => { if (x < 0) return false; const k = Math.max(0, Math.floor(Math.log2(2 * x + 1))); return Math.abs(z) < halfWidth(k) + 0.03; };
    const tuft = (x, z, hmax) => {                                       // a tuft: four or five thin cut blades fanning from one foot, facing the way we come
      const n = 4 + (rv() < 0.5 ? 1 : 0), lit = litAt(x, z), fr = FR.yz(x, z, 0), m = sway[(rv() * 12) | 0];
      bladeCol.copy(darkBlade).lerp(paleBlade, Math.min(1, lit * rv.range(0.85, 1.15)));
      const col = bladeCol.clone();
      for (let b = 0; b < n; b++) {
        const h = Math.min(hmax, rv.range(0.2, 0.5)), lean = (b - (n - 1) / 2) * 0.16 + rv.range(-0.06, 0.06), f = (u, v) => v / 0.5;
        grass.ink(fr, [[0, 0], [lean * h * 0.35, h * 0.55], [lean * h, h]], 0.03, { col, m, taper: true, exact: true, flut: f });
      }
    };
    const nField = Math.round(1500 * detail), nBank = Math.round(420 * detail);
    for (let i = 0; i < nField; i++) {                                    // the field: thick round the foot and the first steps, thinning sideways
      const x = -13.6 + 26 * rv(), z = (rv() < 0.5 ? -1 : 1) * 11 * rv() ** 1.4;
      if (!inStair(x, z)) tuft(x, z, Math.abs(z) < 2.2 && x < 1.5 ? 0.25 : 0.5);
      if (i % 400 === 399) await ctx.yield();
    }
    for (let i = 0; i < nBank; i++) {                                     // the bank's fringe along the river's far edge
      const z = (rv() < 0.5 ? -1 : 1) * 46 * rv() ** 1.3, x = RIVER_X1 + riverBend(z) + 0.12 + 0.5 * rv() * rv();
      tuft(x, z, Math.abs(z) < 2.2 ? 0.25 : 0.5);
      if (i % 400 === 399) await ctx.yield();
    }
    const grassMesh = grass.mesh(0.2); grassMesh.renderOrder = 27; grassMesh.name = 'grass'; scene.add(grassMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- 40 PAPER MOTHS round the candle and the boat
    // Each on its own level ring about the flame or the boat, wings two folded sheets that beat. By place: the rings stand
    // under 0.45 m by the candle and under 0.77 m by the boat, 2.0 m and more beneath the flown line; no near law is taken.
    const mothRings = [];
    for (let g = 0; g < 3; g++) {
      const mc = style.card(0, 0, 1, 0.004), count = g === 0 ? 14 : 13;
      for (let i = 0; i < count; i++) {
        const boat = (g * 14 + i) % 2 === 1, k = boat ? 1 : 0, cx = thingX(k), cy = boat ? rv.range(0.42, 0.72) : rv.range(0.14, 0.42), r = boat ? rv.range(0.25, 0.6) : rv.range(0.12, 0.5);
        const sg = rv.chance(0.5) ? 1 : -1, span = rv.range(0.06, 0.085), s = span / 2;
        const m = mc.motion({ kind: 2, pivot: [cx, cy, 0], axis: [0, 1, 0], freq: sg * rv.range(1.1, 2.4) * 0.3 / r, phase: rv.range(0, 6.28), flutDir: [0, 1, 0], flutFreq: rv.range(13, 18), flutPhase: rv.range(0, 6) });
        const fr = FR.of([cx + r, cy, 0], [1, 0, 0], [0, 0, -sg]);
        mc.k = k; mc.y0 = cy - 1; mc.y1 = cy + 1;
        for (const d of [-1, 1]) mc.sheet(fr, [[0, 0.5 * s], [d * s, 0.62 * s], [d * 0.8 * s, -0.25 * s], [0, -0.3 * s]], { m, flut: (u) => Math.abs(u) * 0.6, edge: 0.6 });
        mothRings.push({ centre: [cx, cy, 0], radius: r, span });
      }
      const mm = mc.mesh(0.7); mm.renderOrder = 29; mm.name = 'moths'; scene.add(mm);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- 96 PAPER MOTHS OVER THE GRASS, two lanes beside our path
    // The candle's moths' make (two folded sheets that beat), CUT LARGER: 16 to 22 cm from tip to tip laid flat (the candle's are
    // 6 to 8.5). The eye passes 2.1 m over the candle's; these fly 2.3 m and more to either side of our path and many times that
    // ahead, where a moth of the candle's size is a sliver a few picture elements long; and their wings are carried up in a V
    // (FIELD.vee), these being seen from the side. From the river's bank to the foot, thickest near the foot and near our path:
    // each on its own ring (0.25 to 0.9 m, a little tilted, 0.35 to 0.75 m/s) about its own place, and four in five turn so
    // that the side of the ring toward our path runs toward the candle. BY PLACE: every ring lies over the grass (FIELD.bank
    // clear of the water, FIELD.foot short of the foot), the whole of it FIELD.clear and more from the stair's middle line,
    // which the flown line keeps here, and 0.65 to 2.3 m up. Dealt from a stream of their own; made once; moved in the shader
    // by time only.
    const FIELD = { n: 96, clear: 2.3, bank: 0.3, foot: 0.6, lane: 3.5, vee: 0.7 }, fieldMoths = [];
    const fv = ctx.core.makeRng(ctx.core.hashSeed('stair-field-moths:' + ctx.seed));
    for (let g = 0; g < FIELD.n / 16; g++) {
      const mc = style.card(0, 0, 3, 0.006); mc.rng = fv;
      for (let i = 0; i < 16; i++) {
        const side = i % 2 ? 1 : -1, r = fv.range(0.25, 0.9), span = fv.range(0.16, 0.22), sp = span / 2, tilt = Math.min(0.2, 0.15 / r) * fv(), ta = fv.range(0, 6.2832);
        const cz = side * (FIELD.clear + r + sp + 0.05 + FIELD.lane * fv() ** 2);
        const x0 = RIVER_X1 + Math.max(riverBend(cz - r), riverBend(cz), riverBend(cz + r)) + FIELD.bank + r + sp, x1 = -FIELD.foot - r - sp;
        const cx = x1 - (x1 - x0) * fv() ** 1.4, cy = 0.8 + 1.2 * fv() ** 1.6, sg = fv.chance(0.8) ? -side : side;
        const m = mc.motion({ kind: 2, pivot: [cx, cy, cz], axis: [tilt * Math.cos(ta), Math.sqrt(1 - tilt * tilt), tilt * Math.sin(ta)], freq: sg * fv.range(0.35, 0.75) / r, phase: fv.range(0, 6.2832), flutDir: [0, 1, 0], flutFreq: fv.range(13, 18), flutPhase: fv.range(0, 6) });
        for (const d of [-1, 1]) mc.sheet(FR.of([cx + r, cy, cz], [d * Math.cos(FIELD.vee), Math.sin(FIELD.vee), 0], [0, 0, -sg]), [[0, 0.5 * sp], [sp, 0.62 * sp], [0.8 * sp, -0.25 * sp], [0, -0.3 * sp]], { m, flut: (u) => u * 0.45, edge: 0.6 });
        fieldMoths.push({ centre: [cx, cy, cz], radius: r, span });
      }
      const mm = mc.mesh(1.2); mm.renderOrder = 29; mm.name = 'fieldMoths'; scene.add(mm);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- THE CLOUDS: cut paper standing upright across the stair
    // One to a step: the ship's, the viaduct's and the cathedral's, and by seed a fourth on the windmill's (steps 7, 8, 9, then
    // 6): only before BUILT risers, and only before a riser's RIGHT half (z positive), the numbers being cut in the left: so
    // none before riser 11, whose right half is not built. Each is one flat cut paper cloud standing upright just before the
    // riser behind its step's thing, its face toward the foot, drawn in ink along its scalloped top. ONE LAW for all: it is as
    // broad as that riser is high, a fifth of that tall, and stands in the riser's top fifth: behind the thing and under the
    // next tread. It drifts to and fro WITHIN that right half, at 2 to 5 m a second at its quickest, slowing to turn at the
    // stair's middle and at the wall's end; its sheet never passes the middle. By place the nearest stand 8 m and more from
    // the flown line.
    const nCloud = rv.int(3, 4), clouds = [];
    for (let i = 0; i < nCloud; i++) {
      const k = i < 3 ? 7 + i : 6, r = rise(k + 1), xc = riserX(k + 1) - 0.02 * r, yb = treadTop(k) + 0.78 * r, B = r, H = 0.2 * r;
      const zc = halfWidth(k + 1) / 2, face = zc;                                                                                // the riser's right half: its middle and half its breadth
      const cc = style.card(k, yb, yb + H, 0.016 * r), lobes = rv.int(4, 6), ph = rv.range(0, 3.14), speed = rv.range(2, 5), dir = rv.chance(0.5) ? 1 : -1, amp = face - B / 2 - 0.02 * r;
      const m = cc.motion({ kind: 4, axis: [0, 0, dir], amp, freq: speed / amp, phase: rv() * 6.2832 });
      const env = (t) => Math.pow(Math.sin(Math.PI * t), 0.6), topOf = (t) => H * env(t) * (0.58 + 0.42 * Math.abs(Math.sin(Math.PI * lobes * t + ph)));
      const N = lobes * 10, topPts = []; for (let q = 0; q <= N; q++) { const t = q / N; topPts.push([(t - 0.5) * B, topOf(t)]); }
      const fr = FR.yz(xc, zc, yb), col = P.paper.clone().multiplyScalar(0.92);
      cc.sheet(fr, [[-B / 2, 0], [B / 2, 0], ...topPts.slice(1, N).reverse()], { m, col });
      cc.ink(fr, topPts, 0, { m, exact: true, even: true }); cc.ink(fr, [[-B / 2, 0], [B / 2, 0]], cc.w * 0.6, { m, exact: true });
      for (let q = 0; q < lobes; q++) {                                                                // a curl of ink under each scallop
        const t = (q + 0.5 - ph / Math.PI) / lobes; if (t < 0.12 || t > 0.88) continue;
        const u = (t - 0.5) * B, rr = B / lobes * 0.3, v = topOf(t) * 0.55, arc = []; for (let e = 0; e <= 6; e++) arc.push([u + rr * Math.cos(Math.PI * e / 6), v + rr * 0.6 * Math.sin(Math.PI * e / 6)]);
        cc.ink(fr, arc, cc.w * 0.8, { m });
      }
      const cm = cc.mesh(amp + B); cm.frustumCulled = false; cm.renderOrder = 28 - k; cm.name = 'clouds'; scene.add(cm);
      clouds.push({ step: k, x: xc, z: zc, bottom: yb, top: yb + H, broad: B, drift: amp, speed: speed * dir });
      await ctx.yield();
    }

    // ---------------------------------------------------------------- THE FLIGHT: the part's flown line, the pace, the one gaze law
    const path = makePath(flownLine()), L = path.length, tmp = new THREE.Vector3(), gaze = new THREE.Vector3(), eye = new THREE.Vector3();
    // the named places on the line, in metres flown (the nearest of 6000 places on the curve to each of the part's marks)
    const S = {}; { const MK = flownMarks(), best = {}, q = new THREE.Vector3(), mk = new THREE.Vector3(); for (let i = 0; i <= 6000; i++) { path.pointAt(i / 6000, q); for (const k in MK) { const dd = q.distanceToSquared(mk.fromArray(MK[k])); if (!(dd >= best[k])) { best[k] = dd; S[k] = i / 6000 * L; } } } }
    await ctx.yield();
    // pace: the 0.43 power of our distance from the foot (on all three axes), within 0.35 and 2.5 of the mean, to the place over
    // the wall of riser 9; from there to the west door it eases to the mean (quickly at first, gently at its end, so that the
    // speed as flown has all but come to the mean at the door); from the door to the rose it is the mean (M is found so that the
    // whole flight's mean pace is 1)
    const rawPace = (u) => { path.pointAt(u, tmp); return Math.pow(Math.max(tmp.length(), 1e-3), 0.43); };
    const U_WALL = S.wall / L, U_DOOR = S.door / L, toMean = (u) => { const t = clamp((u - U_WALL) / (U_DOOR - U_WALL), 0, 1); return smoothstep(0, 1, 1 - (1 - t) * (1 - t)); };
    const lawPace = (u, M) => { const p = clamp(rawPace(u) / M, 0.35, 2.5); return p + (1 - p) * toMean(u); };
    // the engine takes the pace at 65 places and joins them straight: the pace given at a place is the least the law gives within
    // half such a step either way, so that no join runs faster than the law (the walking pace over the foot is kept whole)
    const HALF = 1 / 128, paceWith = (u, M) => Math.min(lawPace(Math.max(0, u - HALF), M), lawPace(u, M), lawPace(Math.min(1, u + HALF), M));
    let M = 7;
    for (let it = 0; it < 30; it++) { let inv = 0; for (let i = 0; i < 64; i++) inv += 2 / (paceWith(i / 64, M) + paceWith((i + 1) / 64, M)); M /= inv / 64; }
    const pace = (u) => paceWith(clamp(u, 0, 1), M);
    await ctx.yield();
    // THE GAZE, one law, a function of our place on the line only.
    // (1) THE FIRST PICTURE HOLDS, from the entry to the river's far bank (x -14): the camera looks along the stair with the
    //     cathedral's tower tops HOLD_TOP of the way from the picture's middle to its top edge (28.4 degrees over the gaze, by
    //     half the world's own lens, FOV), so the whole built stair stands in the picture and the water lies
    //     under it for as long as it can. The engine mixes a gaze into the line's own heading by a weight it raises itself over
    //     the first 0.04 of the flight; the aim given here is the one that, so mixed, gives that heading (as near as the
    //     weight allows while it is small). (2) From the far bank the gaze lowers; the aim is the resting law's from x -10.5, both cameras on it by x -4.
    // (3) THE RESTING LAW, to the ship's mastheads: the gaze rests on the line of the things' middles (through the foot,
    //     rising 0.355 in 1) at the point 0.6 of our x plus 3.5 m ahead of us.
    // (4) FROM THE MASTHEADS the law gives a direction (a bearing and a tilt, each eased from one rest to the next by the metres
    //     flown) and the aim is again the one that, mixed by the engine, gives it: (a) over EASE m it comes to rest on the west
    //     front: the bearing of its door, and the tilt that holds the nearer tower's top UP_TOP of the way from the picture's
    //     middle to its top, so that low over tread 8 we look UP at the viaduct, the towers over it; (b) from the place where
    //     the line begins to rise, to as far beyond the viaduct's middle, it lifts to the tower's top itself, and keeps it up the
    //     wall of riser 9: the cathedral comes up over the wall's edge under the picture's middle; (c) from the wall's top it
    //     comes down the west front to the rose's middle at the nave's far end, and is on it, and so on our heading, where the
    //     last straight before the door begins.
    let topX = 305, topY = 197; { let best = -1e9; const v3 = new THREE.Vector3(); hero.object.traverse((o) => { if (!o.isMesh || o.name !== 'cathedralWest') return; const pa = o.geometry.getAttribute('position'); for (let i = 0; i < pa.count; i++) { v3.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (v3.y > best) { best = v3.y; topX = v3.x; topY = v3.y; } } }); }
    const HOLD_TOP = 0.9, HOLD_ANGLE = Math.atan(HOLD_TOP * Math.tan(FOV / 2 * DEG)), HOLD_X = -14, REST_X = -10.5, G_FROM = -0.03, G_TO = S.door / L, G_FADE = 0.029 / (G_TO - G_FROM), G_WEIGHT = 0.8;
    // how far up the picture the nearer tower's top is held on the low run; the metres from the mastheads over which the gaze comes to the west front
    const UP_TOP = 0.4, UP_ANGLE = Math.atan(UP_TOP * Math.tan(FOV / 2 * DEG)), EASE = 25;
    const heading = new THREE.Vector3(), want = new THREE.Vector3(), aim = new THREE.Vector3(), ahead = new THREE.Vector3(), to = new THREE.Vector3();
    const weightAt = (u) => G_WEIGHT * smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u)) * bell(u, G_FROM, G_TO, G_FADE);   // the engine's own weight here (src/core/engine.js, _pose)
    const headingAt = (u) => { path.posAtDist(u * L + 6, ahead); return heading.subVectors(ahead, tmp).normalize(); };          // the line's own heading, 6 m ahead
    const aimFor = (wt) => {                                                                       // the aim that, mixed with the heading by weight wt, gives the direction want
      const c = heading.dot(want), disc = wt * wt - (1 - wt) * (1 - wt) * (1 - c * c);
      if (disc > 0) aim.copy(want).multiplyScalar((1 - wt) * c + Math.sqrt(disc)).addScaledVector(heading, -(1 - wt)).normalize();
      else aim.copy(want).addScaledVector(heading, -c).normalize();                               // the weight is too small yet: turn as far toward it as it allows
      if (aim.lengthSq() < 0.5) aim.copy(want);
      return aim;
    };
    const bearing = (v) => Math.atan2(v.z, v.x), tilt = (v) => Math.atan2(v.y, Math.hypot(v.x, v.z));
    let gAz = 0, gEl = 0; const ease = (a2, e2, f) => { gAz += (a2 - gAz) * f; gEl += (e2 - gEl) * f; };       // the gaze's bearing and tilt, eased toward a rest
    const pois = [{ from: G_FROM, to: G_TO, fade: G_FADE, weight: G_WEIGHT, at: (time, u) => {
      path.pointAt(u, tmp); const s = u * L, xt = Math.max(1.5, 1.6 * tmp.x + 3.5); gaze.set(xt, 0.355 * (xt + 0.5), 0);
      if (s <= S.ship) {
        if (tmp.x >= REST_X) return gaze;
        const hold = Math.atan2(topY - tmp.y, topX - tmp.x) - HOLD_ANGLE; want.set(Math.cos(hold), Math.sin(hold), 0);
        headingAt(u); aimFor(weightAt(u));
        const k = smoothstep(HOLD_X, REST_X, tmp.x); gaze.sub(tmp).normalize();
        aim.multiplyScalar(1 - k).addScaledVector(gaze, k).normalize();
        return gaze.copy(tmp).addScaledVector(aim, 300);
      }
      const wt = weightAt(u); headingAt(u);
      to.copy(gaze).sub(tmp).normalize().multiplyScalar(wt).addScaledVector(heading, 1 - wt);      // where the resting law looks, as the engine mixes it
      gAz = bearing(to); gEl = tilt(to);
      to.set(DOOR_X, tmp.y, 0).sub(tmp);                                                           // the west front: its door for the bearing, its nearer tower's top UP_TOP up the picture for the tilt
      const westAz = bearing(to), westEl = Math.atan2(topY - tmp.y, Math.hypot(topX - tmp.x, Math.min(Math.abs(tmp.z - CATH.towerZ), Math.abs(tmp.z + CATH.towerZ)))) - UP_ANGLE;
      ease(westAz, westEl, smoothstep(S.ship, S.ship + EASE, s));
      ease(westAz, westEl + UP_ANGLE, smoothstep(S.before, 2 * S.arch - S.before, s));
      to.set(ROSE_X, NAVE_Y, 0).sub(tmp); ease(bearing(to), tilt(to), smoothstep(S.wall, S.straight, s));
      want.set(Math.cos(gEl) * Math.cos(gAz), Math.sin(gEl), Math.cos(gEl) * Math.sin(gAz));
      return gaze.copy(tmp).addScaledVector(aimFor(wt), 300);
    } }];
    await ctx.yield();

    return {
      scene, path, duration: DURATION, pace, pois,
      camera: { fov: FOV, near: 0.3, far: 6000, lookAhead: 6, bank: 0 },
      portal: { shape: 'circle', radius: 7, color: '#F4EFE2', glow: 0.8, style: 'ring' },
      // flat inks under no tone curve: the colour written is the colour shown (the brief's hexes), nothing glows, and nothing hazes
      // when the post eases toward the next world's on the way out
      // (the engine eases every post figure toward the next world's over the last hundred metres: the bloom threshold is set far
      // above anything written here, so the lit paper of the rose's wall is not taken for a lamp until the ring fills the picture)
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.5, threshold: 6 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      figures: { clouds, mothRings, fieldMoths, riverBend, paceMean: M, moon: { side, azimuth: az / DEG, elevation: el / DEG } },   // the valley's own figures; nothing here reads them
      update(dt, time, camera) {
        hero.update(dt, time, camera);                                   // uTime and the picture's height: every motion is in the shaders, by time only
        camera.getWorldPosition(eye); sky.position.copy(eye);          // the dome alone follows the eye
      },
      dispose() {},
    };
  },
};
