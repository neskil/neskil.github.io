// The Night That Would Not Darken (pillar-of-the-white-night), after Edvard Munch, 1863 to 1944.
//
// Eleven at night in late June on a Norwegian fjord that never gets dark. Thin oil on coarse unprimed flax canvas:
// every band of sea and sky is one long streaked stroke (a real ribbon lying on the water or on the sky shell), the
// canvas shows between them, the wood is one green-black mass with one contour and its madder echo, and on the
// water stands the moon's reflection as a solid gold pillar of one width with a round head (the hero, in
// ../parts/pillar-of-the-white-night.js). The sea stands up like a wall: every vertex but the pillar's is lifted with
// its distance from the eye, so the horizon holds 15 degrees above level. Unlit flat paint, post.flat = 1: a hex
// written is the hex shown. Coordinates: +Z is the course; the brief's x is to starboard, world x = SX * brief x.
// Night pass (after the outside review): the sea is laid almost full, twice over, in long level bands (rows across the
// fjord, rings round the pillar, rows along the tongue in the bay), deep ultramarine near and paler with distance; the
// sky's ribbons are closed to a third of canvas; the pillar is one painted face that turns to the eye, larger far off;
// the course no longer goes through it: shallows, jetty, under the wood's headland, low past the pillar with the laying
// strokes, round it on a climbing arc, the fjord from above, and a dive past a heap of crowns to the notch.
// Gold pass (after the second outside review): the column is one firm painted tower (a whole pink ground, a gold go over
// it, the level strokes with their ends in line, a madder echo line up each side); its light is LAID, not glowed: seven
// open gold rings and pink bands round its foot, and one stroke of the gold on the shoulder of every stone and crown
// within 150 m that faces it. No broad pale band lies under the low course; thin level strokes do. The course rises to
// 11 m over the shallows, orbits wider to the north of the pillar and turns in tighter, to a notch and portal half as
// large again with a gold arc innermost.
// Slim pass (after the third outside review): the column is slim (36 wide to 290 tall), some thirty separate level strokes
// with dry gaps the far shore shows through, no ground under them, its round head kept in the picture all the way (its
// height follows the eye's distance: the reflection ignores optics); its light runs out over the water as broken gold
// strokes along the rings, to 170 m, among pink and madder arcs. The course goes ROUND it (180 degrees, down to its foot on
// the west side and up to 50 m in the north) and no longer close past it; before that, in under the wood's wall and
// along a jetty of ruled boards with a two-bar rail and piles. One echo line per stone at most, none over its back.
import * as THREE from 'three';
// Lane pass (after the fourth outside review): the column's light is paint. Its reflection lies down the water as a lane
// of level gold strokes from the foot to the bottom edge, turning about the foot to lie toward the eye, one width with
// the column in the picture; five open echo arcs stand round the head in the sky (gold, pink, pale); the wood carries
// goes of the ultramarine among its downward strokes and its madder contour sits where the dark gives out; the sky has
// thin ultramarine and pink ribbons among the pale. The course climbs from the foot to a look down on the rings from
// 58 m in the north-west, and the column is drawn down by a quarter from there on.
// True pass 5 (laws of place, every colour as it was): the heads of the four laying strokes that overtake us, and the
// column's draw-down, follow where the eye is, never the flight's fraction; the column stands at its height from the
// first frame. The course stands off the wood's wall on the way to the jetty, the eye on the pillar. The heap of crowns
// that stood under the eye inside the last turn stands off the tongue's shore, east of the notch.
import { makePath } from '../kit/core.js';
import {
  buildHero, pigments, STYLE, strokeGeometry, strokeMaterial, runGeometry, runMaterial, canvasMaterial, solidMaterial,
} from '../parts/pillar-of-the-white-night.js';

const PAL = ['#6C7CB8', '#BCC0DE', '#E9C85A', '#1F3A33', '#C97B6A', '#D5D0C2', '#7A3B4A'];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// a smooth curve through (t, v) knots (Catmull-Rom in one dimension)
function knots(K) {
  return (t) => {
    let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const p0 = K[Math.max(i - 1, 0)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(i + 2, K.length - 1)];
    const s = Math.min(1, Math.max(0, (t - p1[0]) / (p2[0] - p1[0])));
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * p1[1] + (s3 - 2 * s2 + s) * m1 + (-2 * s3 + 3 * s2) * p2[1] + (s3 - s2) * m2;
  };
}

// accumulates merged solids for solidMaterial
function solidBuilder() {
  const pos = [], nor = [], col = [], q = [], edge = [], shade = [], idx = [];
  return {
    get count() { return pos.length / 3; },
    v(x, y, z, c, qa, qu, e = 0, s = 0, nx = 0, ny = 1, nz = 0) {
      pos.push(x, y, z); nor.push(nx, ny, nz); col.push(c.r, c.g, c.b); q.push(qa, qu); edge.push(e); shade.push(s);
      return pos.length / 3 - 1;
    },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    async geometry(yieldFn) {            // typed arrays are filled a piece at a time, with a yield between
      const g = new THREE.BufferGeometry(), y = yieldFn || (async () => {});
      const fill = async (out, src) => { for (let i = 0; i < src.length; i += 120000) { out.set(src.slice(i, i + 120000), i); await y(); } return out; };
      const f32 = (src) => fill(new Float32Array(src.length), src);
      g.setAttribute('position', new THREE.BufferAttribute(await f32(pos), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(await f32(nor), 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(await f32(col), 3));
      g.setAttribute('aQ', new THREE.BufferAttribute(await f32(q), 2));
      g.setAttribute('aEdge', new THREE.BufferAttribute(await f32(edge), 1));
      g.setAttribute('aShade', new THREE.BufferAttribute(await f32(shade), 1));
      g.setIndex(new THREE.BufferAttribute(await fill(pos.length / 3 > 65535 ? new Uint32Array(idx.length) : new Uint16Array(idx.length), idx), 1)); await y();
      return g;
    },
  };
}

export default {
  id: 'pillar-of-the-white-night',
  name: 'The Night That Would Not Darken',
  category: 'artists',
  placeKind: 'ocean',
  after: 'Edvard Munch, 1863 to 1944',
  weirdness: 0.3,
  media: ['air', 'water', 'open'],

  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const density = ctx.vary?.density ?? 1;
    const pg = pigments(PAL);
    scene.background = pg.canvas.clone();

    // ---- the edition, picked once (seeded) ----
    const vr = ctx.rng.fork('white-night-edition');
    const hourAsk = ctx.vary?.hour ?? 'any';
    const hourRoll = vr();
    const hour = hourAsk === 'dawn' ? 'one' : hourAsk === 'golden' ? 'afterglow' : (hourAsk === 'night' || hourAsk === 'day') ? 'eleven'
      : hourRoll < 0.5 ? 'eleven' : hourRoll < 0.75 ? 'one' : 'afterglow';
    const windy = vr.chance(0.3);
    const pinkCast = vr.chance(0.5);
    const mirror = vr.chance(0.4);
    const rare = !!ctx.vary?.rare;
    const SX = mirror ? 1 : -1;                       // brief x (to starboard) -> world x
    const P = (x, y, z) => [SX * x, y, z];
    const rng = ctx.rng.fork('white-night-world'), rng0 = rng;
    const prng = ctx.rng.fork('white-night-polish');      // everything added by the polish pass draws from this one
    const mrng = vr.fork('white-night-moon');             // and everything added by the outside-review pass from this one
    const frng = ctx.rng.fork('white-night-night');       // the night pass (the sea laid full, the sky closed, the new course)
    const grng = ctx.rng.fork('white-night-gold');        // the gold pass (the column's body, its light laid on the water, stones and crowns)

    // ---- the path (brief frame, then mirrored): shallows, jetty, open water, the slit, the climb, the diving turn ----
    const HS = 1.2;                                   // the pillar stands a fifth larger than the brief's 300 m, to read at coin size
    const Z0 = -70;                                   // the entry
    const PZ = 780;                                   // where the pillar stands (the brief's place: 123 m to starboard of the notch on the last approach)
    const PY = 12;                                    // the height of the portal's centre
    // home shore: the waterline as x(z), the S of the picture
    const shoreX = knots([[-500, -34], [-250, -24], [0, -14], [150, -60], [290, -27], [450, -70], [540, -64], [640, -100], [800, -205], [1000, -252], [1250, -240], [1500, -190], [1800, -150]]);
    // the jetty's axis (brief frame): from the shore where the S swings back to the course, aimed at the pillar's foot,
    // so the deck's diagonal ends under the gold. JA root, JH head, jd along, jn across (to starboard), JP a point on it.
    const JA = [shoreX(262), 262], JL = 125, jAim = Math.atan2(-JA[0], 780 - 262), JH = [JA[0] + JL * Math.sin(jAim), 262 + JL * Math.cos(jAim)];
    const jd = [(JH[0] - JA[0]) / JL, (JH[1] - JA[1]) / JL], jn = [jd[1], -jd[0]];
    const JP = (s, o, y) => [JA[0] + jd[0] * s + jn[0] * o, y, JA[1] + jd[1] * s + jn[1] * o];
    const DECK_Y = 1.6, RAIL_O = -1.42, RAIL_Y = 2.8;
    const deckY = (s) => 0.12 + (DECK_Y - 0.12) * sm(-18, 0, s);                 // a ramp up from the stones
    const deckEdge = (s) => 2.9 + 1.6 * (1 - sm(-5, 30, s));                     // the open edge: a wide landing at the shore, 4.4 m of deck from 55 m on
    // the course comes in over the landing and runs the length of the deck 2.8 m above it, over its open edge, with the
    // rail plunging on the wood's side: the white diagonal and the gold in one picture
    // (slim pass) THE COURSE: low among the boulders; in under the wood's wall where the shore swings out; the length of
    // the jetty, just off its open edge, the rail plunging on the wood's side; up over the open water along the S of the
    // shore; ROUND THE PILLAR on an arc of 180 degrees, 152 m off and 35 to 40 m up (west, north, north-east), the eye on
    // it; and a diving right turn round a heap of crowns in the bay to the notch. No fly-through.
    const orb = (deg, R, y) => { const a = deg * Math.PI / 180; return [R * Math.sin(a), y, PZ + R * Math.cos(a)]; };
    const TC = [127.5, 880], TR = 52;                 // the last turn: its centre and radius; it comes out on the notch's axis 61 m off
    // (true pass 5) THE COURSE STANDS OFF THE WOOD'S WALL between the first boulders and the jetty: four knots moved to
    // starboard (each at its old z and height), from (-9, 104) (-27, 148) (-36, 196) (-35, 236), which ran into the bay of
    // the shore and along under the wall (the waterline 41 m off at z 110, 23 m at z 180, 6 m at z 224), to a straight slant
    // (46 m off at z 110, 39 m at z 180, 17 m at z 228) that comes to the jetty's root from the open side: the wall is a
    // flank to port with its strand and the water at its foot, not a slab
    const bp = [[0, 2.5, Z0], [0, 2.5, Z0 + 35], [0, 2.8, Z0 + 70], [0.6, 3.9, 50], [-5, 4.6, 104], [-12, 4.0, 148], [-19, 3.8, 196], [-25, 4.0, 236],
      JP(6, 3.9, 4.3), JP(40, 3.7, 4.4), JP(80, 3.7, 4.4), JP(JL - 4, 3.6, 4.7),
      [-26, 13, 424], [-38, 22, 496], [-58, 29, 566], [-86, 33, 640], orb(232, 138, 29), orb(250, 100, 15),
      orb(270, 64, 5.5), orb(290, 74, 6.5), orb(305, 88, 33), orb(325, 108, 63), orb(350, 142, 62), orb(22, 168, 42),
      [TC[0] - TR * Math.sin(0.5), 36, TC[1] + TR * Math.cos(0.5)], [TC[0] + TR * Math.sin(0.25), 32, TC[1] + TR * Math.cos(0.25)], [164.3, 27, 916.8], [179.5, 21.5, 880], [176, 18, 857],
      [164.3, 15, 843.2], [150, 13, 829], [135.5, PY, 814.5], [121, PY, 800]];
    const path = makePath(bp.map((p) => P(p[0], p[1], p[2])));
    await ctx.yield();
    const lowX = new Float32Array(180).fill(1e6);       // (gold pass) world x of the eye at z = Z0 + 5 i while it is under 9 m (1e6: it is not)
    { const pv = new THREE.Vector3(); for (let k = 0; k <= 1200; k++) { path.pointAt(0.6 * k / 1200, pv); const i = Math.round((pv.z - Z0) / 5); if (i >= 0 && i < 180 && pv.y < 9) lowX[i] = pv.x; } }
    const underEye = (x, z, w) => { const i = Math.round((z - Z0) / 5); return i >= 0 && i < 180 && Math.abs(x - lowX[i]) < w; };
    const PORTAL = new THREE.Vector3(SX * 121, PY, 800);
    const PILLAR = new THREE.Vector3(0, 0, PZ);
    // (true pass 5) THE COLUMN'S DRAW-DOWN IS A LAW OF PLACE: the side it is seen from, never when. Full from the south and
    // the west (the whole approach, down to due west of the foot); drawn down by a quarter as the eye's bearing round the foot
    // goes from due west to north-west (the look down on the rings), and to two thirds from due north to north-east (the bay
    // side: the last turn and the way in to the notch), so head, foot and rings are one picture from there; whole again from
    // due east round to due south, where no course goes. Plain compass bearings, none read off the course.
    const pillarSide = (x, z) => {                      // world x, z of the eye -> the share of its height the column keeps
      const a = Math.atan2(SX * (x - PILLAR.x), z - PILLAR.z) * 57.29578;      // the eye's bearing round the foot, degrees (0 north, -90 west, 180 south)
      return 1 - 0.27 * sm(-90, -45, a) - 0.09 * sm(0, 45, a) + 0.36 * sm(90, 180, a);
    };
    const pillarH =(d) => (111 + 0.47 * (Math.sqrt((d - 150) * (d - 150) + 3600) + (d - 150)) / 2) * (0.55 + 0.45 * sm(40, 130, d));      // the reflection ignores optics: 125 m tall at 150 m, 430 m at 820 m, 70 m from its foot

    // ---- shared geography (brief frame) ----
    // the tongue: centre line from its tip (79, 842) south-east to the east shore, x + z = 921; t = metres from the tip
    const TIP = [79, 842], TDIR = [Math.SQRT1_2, -Math.SQRT1_2], NOTCH_T = Math.hypot(121 - 79, 800 - 842);
    const NW = 19, PR = 16;                         // the notch's half width at the foot, and the portal's radius (outside-review pass: both a little larger)
    // east shore: from the tongue's root round the bay to the north, and down the fjord to the south
    // its plan (half thickness) and its contour height, t metres from the tip: a round nose, a low tip, the notch a clear
    // gap where the mass pinches in and comes down to the strand, then the 40 m wall
    const roundEnd = (x, w) => { const e = Math.min(1, Math.max(0, x / w)); return Math.sqrt(1 - (1 - e) * (1 - e)); };    // a rounded end, steep at the foot
    // (polish pass: the mass is drawn in to a narrow waist at the notch, so from above the tongue is two shapes with a gap)
    const tongueHalf = (t) => Math.max(0.8, 30 * roundEnd(t, 30) * (0.14 + 0.86 * sm(5, 50, Math.abs(t - NOTCH_T))));
    const tongueH = (t, ph) => t > NOTCH_T ? (40 + 3.5 * Math.sin(t * 0.045 + ph)) * roundEnd(t - NOTCH_T - NW, 24)
      : 7 * Math.sqrt(Math.max(0, Math.min(1, t / 16))) * roundEnd(NOTCH_T - t - NW, 9);
    const FOOT_T = [10, 50], FOOT_N = [33, 78];      // the band of the tongue's foot boulders: metres along the tongue from the notch's axis, and metres off its centre line into the bay
    const BIG_R = [3.2, 5.6], bigR = (s) => s.range(BIG_R[0], BIG_R[1]);      // the radius of a big shore stone (round the pillar's foot, in the bay): one draw of the stream handed in
    const eastX = knots([[-500, 330], [-100, 318], [300, 300], [560, 285], [700, 300], [900, 345], [1150, 330], [1500, 280], [1800, 240]]);

    STYLE.uLift.value = 1; STYLE.uTime.value = 0;
    const buf = new THREE.Vector2();
    ctx.renderer.getDrawingBufferSize(buf); STYLE.uViewH.value = Math.max(1, buf.y);

    // ---- (1) the canvas: a dome and a lifted ground, grey flax linen ----
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3600, 32, 16), canvasMaterial({ dome: true }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    const groundGeo = (() => {
      const R = [0.7, 8, 20, 40, 60, 90, 130, 180, 240, 310, 390, 480, 600, 800, 1100, 1500, 2100, 3000], S = 72;
      const pos = [], idx = [];
      for (let r = 0; r < R.length; r++) for (let s = 0; s < S; s++) { const a = s / S * Math.PI * 2; pos.push(Math.sin(a) * R[r], 0, Math.cos(a) * R[r]); }
      for (let r = 0; r < R.length - 1; r++) for (let s = 0; s < S; s++) {
        const a = r * S + s, b = r * S + (s + 1) % S, c = a + S, d = b + S; idx.push(a, b, c, b, d, c);
      }
      for (let s = 1; s < S - 1; s++) idx.push(0, s, s + 1);            // the middle: a fan from one rim vertex, none under the eye
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
    })();
    const groundMat = canvasMaterial({ side: THREE.DoubleSide });
    groundMat.transparent = true; groundMat.depthWrite = false;      // drawn after the solids, under every band; the pillar must show through the sea wall
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.renderOrder = 1; ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // materials shared by many meshes
    const bandMat = strokeMaterial({ depthWrite: false, minPx: 1.5, near: 0.12 });        // sea bands, strand, weed
    const bandMatC = strokeMaterial({ depthWrite: false, minPx: 1.5, unit: 3, near: 0.12 });   // the wide bands (built at a third, scaled up)
    const skyMat = strokeMaterial({ depthWrite: false, minPx: 1.5 });         // sky bands (own uHead for the rare event)
    const lineMat = strokeMaterial({ depthWrite: false, minPx: 1.6 });        // contours and echoes: never reached out
    const massMat = solidMaterial({ side: THREE.DoubleSide, streak: 1 });
    const rockMat = solidMaterial({ rim: true, lanes: 0.3 });
    const REACH0 = 300;

    // ---- helpers: a mass as a low-relief hull along a line, and the contour strokes that go with it ----
    // line: [{ x, z, h, bx, bz }] in world metres: foot of the face, contour height, unit vector pointing into the mass
    const massWall = (B, line, o) => {
      const c = o.color, eTop = o.eTop ?? 0.85, back = !!o.back, band0 = o.band ?? 7;
      let arc = 0; const rows = [];
      for (let i = 0; i < line.length; i++) {
        const p = line[i]; if (i) arc += Math.hypot(p.x - line[i - 1].x, p.z - line[i - 1].z);
        const depth = p.depth ?? o.depth ?? 60, band = Math.min(band0, depth * 0.16);
        const h = Math.max(p.h, 0.01), kh = Math.min(1, h / 20), rise = (o.rise ?? 4) * kh, lean = Math.min((o.lean ?? 5) * kh, depth * 0.12), bd = Math.min(band, h * 0.5);
        const at = (f, y, e, qu) => B.v(p.x + p.bx * f, y, p.z + p.bz * f, c, arc, qu ?? y, e);
        const r = [at(0, -3, 0), at(lean * (1 - bd / h), h - bd, 0), at(lean, h, eTop),
          at(lean + band * 1.2, h + rise * 0.15, 0, h + band), at(depth - band * 1.2, h + rise * 0.9, 0, h + depth * 0.2 - band)];
        if (back) r.push(at(depth - lean, h, eTop, h + depth * 0.2), at(depth - lean * (1 - bd / h), h - bd, 0), at(depth, -3, 0));
        else r.push(at(depth, h + rise, 1, h + depth * 0.2));
        rows.push(r);
      }
      for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < rows[i].length - 1; k++) if (line[i].h > 0.5 || line[i + 1].h > 0.5) B.quad(rows[i][k], rows[i + 1][k], rows[i + 1][k + 1], rows[i][k + 1]);
    };
    // contour or echo: ribbons following the top of a line, `up` metres above it, in runs that stop short of closing
    const contourStrokes = (out, line, o, rng = rng0) => {
      const up = o.up ?? 0, half = o.half ?? 0.5, runLen = o.runLen ?? [300, 700], gap = o.gap ?? [8, 40], off = o.off ?? 0, wander = o.wander ?? 0;
      let i = 0; const ph = rng.range(0, 6.28);
      while (i < line.length - 2) {
        const want = rng.range(runLen[0], runLen[1]); let len = 0; const pts = [];
        while (i < line.length && len < want) {
          const p = line[i]; if (pts.length) len += Math.hypot(p.x - line[i - 1].x, p.z - line[i - 1].z);
          const w = wander * Math.sin(i * 0.37 + ph) + wander * 0.5 * Math.sin(i * 1.13 + ph * 2);       // the echo wanders off its contour
          if (p.h > (o.minH ?? 2)) pts.push([p.x + p.bx * off, p.h + up + w, p.z + p.bz * off]); else if (pts.length) { i++; break; }
          i++;
        }
        if (pts.length >= 3) out.push({ pts, half, side: [0, 1, 0], color: o.color, seed: rng(), dry: o.dry ?? -0.15, margin: Math.min(4, len * 0.1),
          wave: [o.drift ?? 0.3, rng.range(200, 420) * (o.drift > 1 ? 3 : 1), rng.range(0, 6.28), rng.range(0.7, 1.3)] });
        let g = rng.range(gap[0], gap[1]); while (i < line.length - 1 && g > 0) { g -= Math.hypot(line[i].x - line[i - 1].x, line[i].z - line[i - 1].z); i++; }
      }
    };
    const solids = solidBuilder(), lines = [];

    // ---- (2) the sky: long level ribbons on a shell that follows the eye; no stars, no cloud, no moon ----
    const SKS = 12, RS = 3000 / SKS;                  // the sky is built small and scaled up 12 times
    const skyGroup = new THREE.Group(); skyGroup.scale.setScalar(SKS); scene.add(skyGroup);
    {
      const list = [], n = Math.round((hour === 'one' ? 150 : 215) * (0.8 + 0.2 * detail));
      const ribbon = (a0, span, h, half, color, dryv, rng = rng0) => {
        const N = Math.max(6, Math.ceil(span / 0.05)), bow = rng.range(-55, 55) / SKS, dir = rng.chance(0.5) ? 1 : -1, pts = [];
        for (let k = 0; k <= N; k++) { const t = k / N, a = a0 + dir * span * (t - 0.5); pts.push([Math.sin(a) * RS, h / SKS + bow * 4 * t * (1 - t), Math.cos(a) * RS]); }
        list.push({ pts, half: half / SKS, side: [0, 1, 0], color, seed: rng(), dry: dryv - 0.2, margin: 30 / SKS,
          wave: [rng.range(14, 34) / SKS, rng.range(600, 1500) / SKS, rng.range(0, 6.28), rng.range(0.7, 1.3) * (rng.chance(0.5) ? 1 : -1)] });
      };
      for (let i = 0; i < n; i++) {
        const f = rng(), h = 40 + 2100 * f * f * 0.9 + 2100 * 0.1 * f;                    // denser low, where the frame looks
        const span = (windy ? rng.range(0.13, 0.3) : rng.range(0.22, 0.62)) * (1 + 0.3 * f);
        const top = h > 1250, low = h > 170 && h < 380;
        let color = pg.pale;
        if (hour !== 'one' && top && rng.chance(0.4)) color = pg.ultra;                    // a few deeper ones near the top
        if (low && rng.chance(hour === 'afterglow' ? 0.5 : 0.16)) color = pg.pink;         // pink just above the far hills
        ribbon(rng.range(0, Math.PI * 2), span, h, rng.range(30, 62) * (1 + 0.5 * f) * (windy ? 0.75 : 1), color, rng.range(-0.15, 0.3));
        if (windy && rng.chance(0.6)) ribbon(rng.range(0, Math.PI * 2), span, h + rng.range(-60, 60), rng.range(24, 44), pg.pale, rng.range(0, 0.3));
      }
      if (hour === 'afterglow') {                                                         // four long level pink bands and one of madder over the hills
        for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++)
          ribbon(j * 2.1 + rng.range(-0.3, 0.3), rng.range(0.7, 1.0), 210 + k * 85 + rng.range(-20, 20), k === 2 ? 22 : rng.range(34, 52), k === 2 ? pg.madder : pg.pink, rng.range(-0.3, 0.1));
      }
      // (night pass) the sky is closed: more long level ribbons where the frame looks, so canvas is a third of it and no
      // more; its few deep bands lie at the top of the picture, and one band of pink just above the far hills
      const n2 = Math.round((hour === 'one' ? 90 : 190) * (0.75 + 0.25 * detail));
      for (let i = 0; i < n2; i++) {
        const f = frng(), h = 360 + 800 * f;
        ribbon(frng.range(0, Math.PI * 2), (windy ? frng.range(0.14, 0.32) : frng.range(0.3, 0.72)), h, frng.range(34, 58) * (1 + 0.3 * f), pg.pale, frng.range(-0.1, 0.25), frng);
      }
      if (hour !== 'one') for (let i = 0; i < 16; i++)
        ribbon(i / 16 * Math.PI * 2 + frng.range(-0.2, 0.2), frng.range(0.45, 0.8), frng.range(820, 1180), frng.range(26, 44), pg.ultra, frng.range(-0.05, 0.2), frng);
      for (let i = 0; i < 9; i++)
        ribbon(i / 9 * Math.PI * 2 + frng.range(-0.15, 0.15), frng.range(0.62, 0.95), frng.range(335, 455), frng.range(24, 36), pg.pink, frng.range(-0.3, -0.1), frng);
      // (lane pass) the sky has body: among the pale ribbons thinner goes of the ultramarine lie level at every height the
      // frame shows, and a few more of the pink low down; canvas is still a third of it and the pale still its colour
      { const srng = ctx.rng.fork('white-night-sky');
        if (hour !== 'one') for (let i = 0; i < 46; i++) { const f = srng(); ribbon(srng.range(0, Math.PI * 2), srng.range(0.3, 0.75), 330 + 1250 * f, srng.range(13, 26) * (1 + 0.5 * f), pg.ultra, srng.range(-0.05, 0.3), srng); }
        for (let i = 0; i < 14; i++) ribbon(srng.range(0, Math.PI * 2), srng.range(0.4, 0.8), srng.range(240, 760), srng.range(14, 24), pg.pink, srng.range(-0.2, 0.1), srng); }
      const geo = await strokeGeometry(list, ctx.yield);
      const sky = new THREE.Mesh(geo, skyMat); sky.renderOrder = 4; sky.frustumCulled = false; skyGroup.add(sky);
    }
    await ctx.yield();

    // ---- the far hills: one band closing the fjord, one contour and its echo ----
    const hillLine = [];
    {
      const N = 200, hk = [];
      for (let i = 0; i < 24; i++) hk.push(rng.range(0.25, 1));
      for (let i = 0; i <= N; i++) {
        const a = i / N * Math.PI * 2, f = a / (Math.PI * 2) * 24, i0 = Math.floor(f) % 24, i1 = (i0 + 1) % 24, t = f - Math.floor(f);
        const hh = lerp(hk[i0], hk[i1], t * t * (3 - 2 * t));
        const rx = 1330 + 90 * Math.sin(a * 3 + 1), rz = 1040 + 70 * Math.sin(a * 2 + 2);
        const x = Math.sin(a) * rx, z = 650 + Math.cos(a) * rz, l = Math.hypot(x, z - 650) || 1;
        hillLine.push({ x: SX * x, z, h: 60 + 95 * hh + 14 * Math.sin(i * 0.9), bx: SX * x / l, bz: (z - 650) / l });
      }
      await ctx.yield();
      massWall(solids, hillLine, { color: pg.ultra, depth: 260, rise: 18, lean: 30, eTop: 0.8, band: 22 });
      contourStrokes(lines, hillLine, { up: 3, half: 2.6, color: pg.madder, runLen: [700, 1500], gap: [60, 160], off: 30, drift: 5 });
      contourStrokes(lines, hillLine, { up: 30, half: 2.2, color: pg.madder, runLen: [500, 1100], gap: [90, 240], off: 30, wander: 7, drift: 8, dry: 0.1 });
    }
    await ctx.yield();
    // ---- (5a) the wood: one green-black mass with one swung contour; the strand; the tongue with its notch ----
    const bands = [];                                   // every level stroke lying on the water (one mesh)
    const woodLine = [], tongueLine = [], eastLine = [];
    {
      const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28);
      for (let z = -520; z <= 1500; z += 13) {
        const dxdz = (shoreX(z + 5) - shoreX(z - 5)) / 10, nl = Math.hypot(1, dxdz);
        const bx = -1 / nl, bz = dxdz / nl;                                  // into the mass (brief frame)
        const set = 10.5 + 2.5 * Math.sin(z * 0.019 + p1);
        const h = (37.5 + 5.5 * Math.sin(z * 0.0105 + p1) + 2.6 * Math.sin(z * 0.029 + p2)) * sm(-520, -380, z) * (1 - sm(1250, 1480, z));
        woodLine.push({ x: SX * (shoreX(z) + bx * set), z: z + bz * set, h, bx: SX * bx, bz });
      }
      await ctx.yield();
      massWall(solids, woodLine, { color: pg.wood, depth: 95, rise: 7, lean: 6 });
      contourStrokes(lines, woodLine, { up: -4.6, half: 0.5, color: pg.madder, runLen: [220, 520], gap: [10, 40], off: 4.1, wander: 0.5 });      // (lane pass) the contour is drawn where the dark gives out, not above the canvas band over it
      contourStrokes([], woodLine, { up: 10, half: 0.8, color: pg.madder, runLen: [300, 600], gap: [30, 90], off: 97, wander: 1.5, dry: 0.1 });      // (lane pass) the echo along the wood's back is not laid: seen from under the wall it crossed the sky as a stray line
      // the strand: one swung stroke of pink between wood and water, laid in a few goes
      let z = -480;
      while (z < 1420) {
        const len = rng.range(260, 520), pts = [], offx = rng.range(-5.5, -4.2);
        for (let s = 0; s <= len; s += 12) pts.push(P(shoreX(z + s) + offx + 0.8 * Math.sin((z + s) * 0.05), 0.06, z + s));
        bands.push({ pts, half: rng.range(3.4, 4.6), color: pg.pink, seed: rng(), dry: rng.range(-0.3, 0.05), margin: 6, order: 5,
          wave: [0.35, rng.range(90, 160), rng.range(0, 6.28), rng.range(0.4, 0.8)] });
        z += len + rng.range(-30, 14);
      }
      // the tongue: tip at (79, 842), running south-east into the east shore; the notch at the portal
      const nx = Math.SQRT1_2, nz = Math.SQRT1_2;                           // its north-east face looks this way
      const tongueBack = [];
      for (let t = 0.4; t <= 318; t += (t < 30 || Math.abs(t - NOTCH_T) < 36 ? 2.2 : 4.5)) {
        const cx = TIP[0] + TDIR[0] * t, cz = TIP[1] + TDIR[1] * t;
        // (polish pass) its two edges swing a little, each stretch on its own, so from above it is not a straight-sided slab
        const h = tongueH(t, p2), halfT = tongueHalf(t) * (1 + sm(18, 60, Math.abs(t - NOTCH_T)) * (0.17 * Math.sin(t * 0.047 + p1) + 0.07 * Math.sin(t * 0.13 + p2)));
        tongueLine.push({ x: SX * (cx + nx * halfT), z: cz + nz * halfT, h, bx: -SX * nx, bz: -nz, halfT, depth: 2 * halfT });
        tongueBack.push({ x: SX * (cx - nx * halfT), z: cz - nz * halfT, h, bx: SX * nx, bz: nz });
      }
      await ctx.yield();
      { const o = { color: pg.wood, rise: 0, lean: 5, back: true };
        massWall(solids, tongueLine, o); }
      await ctx.yield();
      contourStrokes(lines, tongueLine, { up: 2.0, half: 0.42, color: pg.madder, runLen: [60, 200], gap: [6, 18], off: 5, wander: 0.7 });
      contourStrokes(lines, tongueBack, { up: 2.4, half: 0.5, color: pg.madder, runLen: [120, 260], gap: [10, 30], off: 4, wander: 0.9, dry: 0.1 });
      for (const side of [1, -1]) {                                        // its strand, either side of the notch
        const pts = [];
        for (let t = side > 0 ? NOTCH_T + NW + 5 : 6; t <= (side > 0 ? 300 : NOTCH_T - NW - 5); t += 9)
{ const o = tongueHalf(t) + 5 + 1.2 * Math.sin(t * 0.08); pts.push(P(TIP[0] + TDIR[0] * t + nx * o, 0.06, TIP[1] + TDIR[1] * t + nz * o)); }
        if (side < 0) pts.reverse();
        bands.push({ pts, half: 3.6, color: pg.pink, seed: rng(), dry: -0.25, margin: 3, order: 5, wave: [0.3, 120, rng.range(0, 6.28), 0.6] });
      }
      // the east shore
      for (let z = -520; z <= 1500; z += 15) {
        const dxdz = (eastX(z + 5) - eastX(z - 5)) / 10, nl = Math.hypot(1, dxdz);
        const h = (35 + 5 * Math.sin(z * 0.012 + p2) + 2.5 * Math.sin(z * 0.033 + p1)) * sm(-520, -380, z) * (1 - sm(1300, 1480, z));
        eastLine.push({ x: SX * eastX(z), z, h, bx: SX / nl, bz: -dxdz / nl });
      }
      await ctx.yield();
      massWall(solids, eastLine, { color: pg.wood, depth: 110, rise: 7, lean: 6 });
      contourStrokes(lines, eastLine, { up: 2.2, half: 0.5, color: pg.madder, runLen: [240, 560], gap: [14, 50], off: 6, wander: 0.9 });
      { let z2 = -400; while (z2 < 1400) {
        const len = rng.range(280, 520), pts = [];
        for (let s = 0; s <= len; s += 14) pts.push(P(eastX(z2 + s) - 5, 0.06, z2 + s));
        if (!(z2 < 660 && z2 + len > 600)) bands.push({ pts, half: 4, color: pg.pink, seed: rng(), dry: -0.2, margin: 6, order: 5, wave: [0.35, 130, rng.range(0, 6.28), 0.6] });
        z2 += len + rng.range(-20, 20);
      } }
    }
    await ctx.yield();

    // ---- (5a2) islets in the open water (polish pass): the wood's own stuff standing in the sea. Each is one green-black
    // ---- mass with a humped contour, its madder echo and a pink strand, so the open plain between the jetty and the
    // ---- pillar has a dark shape at each side of the gold and something near to pass
    const ISLETS = [                                   // brief frame: centre, length, bearing of its line, half width, height, humps
      { x: 24, z: 612, len: 72, a: -0.15, half: 12, h: 20, humps: 2 },         // (night pass) to starboard of the new course
      { x: 40, z: 522, len: 58, a: -0.25, half: 10, h: 17, humps: 1.6 },
      { x: 58, z: 716, len: 46, a: 0.5, half: 8, h: 12, humps: 1.3 },
      { x: 46, z: 1012, len: 80, a: 1.35, half: 15, h: 24, humps: 2.2 },      // inside the diving turn: the gold stroke swings round it
      { x: -24, z: 968, len: 40, a: 1.3, half: 8, h: 11, humps: 1.2 },       // dead ahead as we come out behind the pillar
      // the moon's skerry (outside-review pass): the place the pillar stands on. A dark mass of crowns at each side of
      // its foot, so the gold rises between two green-black shapes and is seated in depth from every side
      { x: -17, z: PZ - 27, len: 20, a: 0.9, half: 5.5, h: 6.5, humps: 1.2, moon: true },      // (night pass) low: the course rounds the foot on this side
      { x: 31, z: PZ + 4, len: 26, a: 0, half: 7, h: 9.5, humps: 1.2, moon: true },
      // (night pass) a heap of crowns in the bay. (true pass 5) It stood at the centre of the last turn (129, 880), 52 m from the
      // eye all the way round and on every line of sight from the turn to the ring: under the eye, cut by the bottom edge, in
      // front of the portal. It stands now off the tongue's shore to the east of the notch, with the notch's own crowns: on
      // the far side of the last approach from every line of sight to the ring, its line nowhere nearer the course than 50 m
      // and its crowns than 40 m (three times the eye's height there), so it is seen whole across the bay and leaves by the
      // side of the picture, never by the bottom edge
      { x: 212, z: 794, len: 36, a: 2.36, half: 9, h: 20, humps: 1.2, moon: true },
    ];
    const isletLines = [], isletLobes = [], prng0 = prng;
    for (const I of ISLETS) {
      const dx = Math.sin(I.a), dz = Math.cos(I.a), sg = I.x < 0 ? 1 : -1, nx = sg * dz, nz = -sg * dx;      // n points to the course
      const prng = I.moon ? mrng : prng0;
      const ph = prng.range(0, 6.28), front = [], back = [], ring = [];
      for (let t = 0.4; t <= I.len - 0.3; t += 2.4) {
        const e = roundEnd(t, 16) * roundEnd(I.len - t, 16);
        const half = Math.max(0.8, I.half * e * (0.85 + 0.15 * Math.sin(t * 0.09 + ph)));
        const h = I.h * (0.7 + 0.3 * (0.5 + 0.5 * Math.cos(6.2832 * I.humps * t / I.len + ph))) * roundEnd(t - 0.5, 13) * roundEnd(I.len - t - 0.5, 13);
        const cx = I.x + dx * (t - I.len / 2), cz = I.z + dz * (t - I.len / 2);
        front.push({ x: SX * (cx + nx * half), z: cz + nz * half, h, bx: -SX * nx, bz: -nz, depth: 2 * half });
        back.push({ x: SX * (cx - nx * half), z: cz - nz * half, h, bx: SX * nx, bz: nz });
        ring.push([cx, cz, half]);
      }
      // the mass itself is a heap of rounded crowns, made as the boulders are (one contour where each turns away, one
      // echo over its back, one echo lying round it on the water): no trunk, no leaf
      { const n = Math.max(2, Math.round(I.len / (I.half * 1.35)));
        for (let k = 0; k < n; k++) {
          const t = I.len * (k + 0.5 + prng.range(-0.15, 0.15)) / n, end = k === 0 || k === n - 1;
          const r = I.half * prng.range(0.86, 1.08) * (end ? 0.78 : 1), hh = I.h * (end ? 0.72 : prng.range(0.85, 1.1));
          isletLobes.push({ x: I.x + dx * (t - I.len / 2) + prng.range(-2, 2), z: I.z + dz * (t - I.len / 2) + prng.range(-2, 2), r, sy: hh / (1.28 * r), wood: true, moon: !!I.moon });
        }
        for (let k = 0; k < (I.moon && !I.stones ? 0 : 5); k++) {   // and a few shore stones at its foot, on the course's side
          const t = prng.range(0.1, 0.9) * I.len, i = Math.min(ring.length - 1, Math.floor(t / 2.4)), o = ring[i][2] + prng.range(5, 12);
          isletLobes.push({ x: ring[i][0] + nx * o, z: ring[i][1] + nz * o, r: prng.range(0.8, 2.4), sk: true, pk: true, moon: !!I.moon });
        } }
      for (const side of [1, -1]) {                    // its strand, either side, and one echo lying on the water outside it
        const pts = ring.map((r) => P(r[0] + side * nx * (r[2] + 4.2), 0.06, r[1] + side * nz * (r[2] + 4.2)));
        if (side < 0) pts.reverse();
        bands.push({ pts, half: 2.7, color: pg.pink, seed: prng(), dry: -0.2, margin: 3, order: 5, wave: [0.3, 110, prng.range(0, 6.28), 0.6] });
        const ech = ring.map((r, i) => P(r[0] + side * nx * (r[2] + 10.5 + 1.6 * Math.sin(i * 0.31 + ph)), 0.07, r[1] + side * nz * (r[2] + 10.5 + 1.6 * Math.sin(i * 0.31 + ph))));
        bands.push({ pts: ech, half: 0.5, color: pg.madder, seed: prng(), dry: 0.05, margin: 4, order: 6, wave: [0.3, 90, prng.range(0, 6.28), 0.7] });
      }
      isletLines.push(front, back);
      await ctx.yield();
    }
    // ---- (polish 1) THE COURSE AS A KEEP-OUT, for the three things this round adds and for nothing else: its plan as
    // ---- eyes every 2.5 m of ROUTE (world x, z), and one test, a margin in metres round a point of the brief frame.
    // ---- No added thing has any other reference to the course: none is placed, begun, sized or turned by it
    const routeEyes = [];
    { const ev = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 2.5) { path.posAtDist(d, ev); routeEyes.push(ev.x, ev.z); } }
    const clearOfRoute = (x, z, m) => { const wx = SX * x; for (let i = 0; i < routeEyes.length; i += 2) if (Math.hypot(routeEyes[i] - wx, routeEyes[i + 1] - z) < m) return false; return true; };
    await ctx.yield();
    // ---- (polish 1, addition 1) THE HOLM OF THE BAY: a small wooded holm in the fjord off the first bay of the home
    // ---- shore, the wood's own stuff as every islet is: rounded green-black crowns in one heap (no tree, trunk or leaf),
    // ---- a pink strand stroke down each long side, one thin madder echo on the water outside each strand, five shore
    // ---- stones at its inshore foot. ITS PLACE IS THE SHORE'S: abreast of the bay's knot of the shore curve (z 150, where
    // ---- the waterline swings furthest out to port), its inshore foot on the outer edge of the shallows, which is where
    // ---- the shore's own boulder law ends (78 m less 5 m off the waterline); its long axis along +z, as the shore runs at
    // ---- its knot (the curve's slope there is 13 m in 290, under 3 degrees). Its half thickness, length, height and humps
    // ---- are those of the islets' own smallest (the one of half width 8: length 46, height 12, humps 1.3). Built line for
    // ---- line as an islet is; every draw from its own stream. It is mirrored with the world like every islet and has no
    // ---- hour, wind or rare branch. Its outline is not given to the runs (they draw from a stream of the world's).
    {
      const hrng = ctx.core.makeRng(ctx.core.hashSeed('white-night-holm:' + ctx.seed));
      const HALF = 8, FOOT = shoreX(150) - 5 + 78;        // the islets' smallest half width; the outer edge of the shallows abreast of the knot (brief x 13)
      const I = { x: FOOT + HALF, z: 150, len: 46, a: 0, half: HALF, h: 12, humps: 1.3 };
      const dx = Math.sin(I.a), dz = Math.cos(I.a), nx = -dz, nz = dx;      // n points inshore, to the home shore
      const ph = hrng.range(0, 6.28), ring = [];
      for (let t = 0.4; t <= I.len - 0.3; t += 2.4) {
        const e = roundEnd(t, 16) * roundEnd(I.len - t, 16);
        ring.push([I.x + dx * (t - I.len / 2), I.z + dz * (t - I.len / 2), Math.max(0.8, I.half * e * (0.85 + 0.15 * Math.sin(t * 0.09 + ph)))]);
      }
      // KEEP-OUT: no crown or stone of it nearer the course in plan than its own radius plus 4 m (a plain number); one that
      // fails is not laid. By the place none fails: its nearest crown is some 22 m from the course, its nearest stone 9 m
      const n = Math.max(2, Math.round(I.len / (I.half * 1.35)));
      for (let k = 0; k < n; k++) {
        const t = I.len * (k + 0.5 + hrng.range(-0.15, 0.15)) / n, end = k === 0 || k === n - 1;
        const r = I.half * hrng.range(0.86, 1.08) * (end ? 0.78 : 1), hh = I.h * (end ? 0.72 : hrng.range(0.85, 1.1));
        const lobe = { x: I.x + dx * (t - I.len / 2) + hrng.range(-2, 2), z: I.z + dz * (t - I.len / 2) + hrng.range(-2, 2), r, sy: hh / (1.28 * r), wood: true, rs: hrng };
        if (clearOfRoute(lobe.x, lobe.z, lobe.r + 4)) isletLobes.push(lobe);
      }
      for (let k = 0; k < 5; k++) {                      // the shore stones at its inshore foot, 5 to 12 m off it, as at every islet
        const t = hrng.range(0.1, 0.9) * I.len, i = Math.min(ring.length - 1, Math.floor(t / 2.4)), o = ring[i][2] + hrng.range(5, 12);
        const stone = { x: ring[i][0] + nx * o, z: ring[i][1] + nz * o, r: hrng.range(0.8, 2.4), sk: true, pk: true, rs: hrng };
        if (clearOfRoute(stone.x, stone.z, stone.r + 4)) isletLobes.push(stone);
      }
      for (const side of [1, -1]) {                      // its strand, either side, and one echo lying on the water outside it (the islets' own widths and offsets)
        const pts = ring.map((r) => P(r[0] + side * nx * (r[2] + 4.2), 0.06, r[1] + side * nz * (r[2] + 4.2)));
        if (side < 0) pts.reverse();
        bands.push({ pts, half: 2.7, color: pg.pink, seed: hrng(), dry: -0.2, margin: 3, order: 5, wave: [0.3, 110, hrng.range(0, 6.28), 0.6] });
        const ech = ring.map((r, i) => P(r[0] + side * nx * (r[2] + 10.5 + 1.6 * Math.sin(i * 0.31 + ph)), 0.07, r[1] + side * nz * (r[2] + 10.5 + 1.6 * Math.sin(i * 0.31 + ph))));
        bands.push({ pts: ech, half: 0.5, color: pg.madder, seed: hrng(), dry: 0.05, margin: 4, order: 6, wave: [0.3, 90, hrng.range(0, 6.28), 0.7] });
      }
    }
    await ctx.yield();

    // ---- the moon's skerry, the rest of it: a ring of big shore stones round the foot of the pillar, pink before pale,
    // ---- and the gold lying on the water round it: the foot's echo, laid in open rings as every echo is, and short
    // ---- level strokes where the runs have reached the water. Gold stays the pillar's: nothing here is beyond 95 m of it.
    const moonStones = [];
    {
      const put = (x, z, r, big) => { if (Math.abs(x) > 31 && Math.abs(z - PZ) < 30) return; moonStones.push({ x, z, r, sk: true, pk: mrng.chance(0.72), moon: true, gold: Math.hypot(x, z - PZ) < 64 && r > 1.3, big }); };
      for (const sgn of [-1, 1]) {                       // before the foot (as we come) and behind it
        const n = Math.round(15 * (0.7 + 0.3 * detail));
        for (let k = 0; k < n; k++) {
          const a = mrng.range(-1.05, 1.05), rho = 26 + 44 * Math.pow(mrng(), 1.3), big = k < 5;
          put(Math.sin(a) * rho * 1.15 + (big ? (k % 2 ? 1 : -1) * mrng.range(4, 12) : 0), PZ + sgn * (13 + Math.cos(a) * rho), big ? bigR(mrng) : mrng.range(0.9, 2.6), big);
        }
      }
      for (let k = 0; k < 10; k++) { const a = mrng.range(0, 6.28), rho = mrng.range(66, 92); put(Math.sin(a) * rho * 1.2, PZ + Math.cos(a) * rho, mrng.range(0.8, 2.2), false); }
      // (slim pass) THE LIGHT ON THE WATER, laid and not glowed: the gold runs out from the foot over the sea in long
      // level strokes that follow the rings (level to the eye from every side as we go round), broken, swaying, loaded and
      // broad at the foot, thinner, drier and further apart out to 170 m; among them open arcs of the pink and thin dry
      // arcs of madder, the foot's echo repeated outward as every echo is
      const arc = (rho, a0, sweep, half, color, dry, order, y = 0.075) => {
        const N = Math.max(5, Math.ceil(rho * sweep / 6)), ph = mrng.range(0, 6.28), pts = [];
        for (let k = 0; k <= N; k++) { const a = a0 + sweep * k / N, rr = rho * (1 + 0.035 * Math.sin(a * 2.3 + ph) + 0.015 * Math.sin(a * 5.1 + ph * 2)); pts.push(P(Math.sin(a) * rr, y, PZ + Math.cos(a) * rr)); }
        bands.push({ pts, half, color, seed: mrng(), dry, margin: Math.min(3, rho * sweep * 0.08), order, wave: [mrng.range(0.5, 1.0), mrng.range(40, 90), mrng.range(0, 6.28), mrng.range(0.6, 1.1) * (mrng.chance(0.5) ? 1 : -1)] });
      };
      const nGold = Math.round(84 * (0.7 + 0.3 * detail));
      for (let k = 0; k < nGold; k++) {
        const f = (k + mrng()) / nGold, rho = 7 + 165 * Math.pow(f, 1.55), len = mrng.range(18, 64) * (0.7 + 0.6 * f), far = sm(15, 160, rho);
        arc(rho, mrng.range(0, 6.28), Math.min(2.4, len / rho), lerp(1.9, 0.42, far) * mrng.range(0.75, 1.25), pg.gold, mrng.range(-0.25, 0.1) + 0.3 * far, 6.2);
      }
      for (let k = 0; k < 4; k++) arc(4.5 + 2.6 * k, mrng.range(0, 6.28), mrng.range(3.6, 5.2), 1.5, pg.gold, -0.4, 6.25);      // the pool at the foot itself
      const nWarm = Math.round(34 * (0.7 + 0.3 * detail));
      for (let k = 0; k < nWarm; k++) {
        const rho = mrng.range(16, 205), thin = k % 3 === 2;
        arc(rho, mrng.range(0, 6.28), Math.min(2.6, mrng.range(40, 130) / rho), thin ? mrng.range(0.3, 0.5) : mrng.range(0.9, 2.1), thin ? pg.madder : pg.pink, thin ? mrng.range(0.05, 0.3) : mrng.range(-0.2, 0.2), thin ? 6.15 : 6.05);
      }
      // the exit's own setting (outside-review pass): rounded crowns of the wood standing at each side of the notch, and
      // shore stones under the eye all the way down the dive and the last approach, cut by the bottom edge
      const pv = new THREE.Vector3(), tv = new THREE.Vector3();
      const nStone = Math.round(54 * (0.7 + 0.3 * detail));
      for (let k = 0; k < nStone; k++) {
        const u = 0.775 + 0.21 * (k + mrng()) / nStone; path.pointAt(u, pv); path.tangentAt(u, tv);
        const tl = Math.hypot(tv.x, tv.z) || 1, sd = k % 2 ? 1 : -1, off = sd * (3.4 + 15 * Math.pow(mrng(), 1.5));
        moonStones.push({ x: SX * (pv.x + tv.z / tl * off), z: pv.z - tv.x / tl * off, r: 0.8 + 2.9 * Math.pow(mrng(), 1.7), sk: true, pk: mrng.chance(0.6), moon: true, exit: true });
      }
      for (let k = 0; k < 14; k++) {                     // and under the climb to the slit
        const z = mrng.range(692, 772), sd = k % 2 ? 1 : -1;
        moonStones.push({ x: sd * (3 + 15 * Math.pow(mrng(), 1.3)), z, r: mrng.range(1.1, 3.3), sk: true, pk: mrng.chance(0.6), moon: true });
      }
      // (o: metres outside the north-east face; null: on the centre line, so the low tip and the wall's end at the notch
      // are heaps of crowns from above and not a slab; negative: outside the south-west face)
      for (const [dt, r, hh, o] of [[NW + 9, 9.5, 21, 3], [NW + 25, 12.5, 30, 6], [NW + 46, 11, 26, 4], [-NW - 7, 6.2, 11, 2], [-NW - 19, 7.5, 14, 4],
        [10 - NOTCH_T, 6.5, 10, null], [24 - NOTCH_T, 8, 13.5, null], [38 - NOTCH_T, 7, 12, null], [NW + 15, 12, 45, null], [NW + 39, 14, 47, null], [NW + 64, 13, 45, null], [NW + 91, 14, 48, null], [NW + 12, 9, 22, -3], [NW + 32, 11, 28, -4]]) {
        const t = NOTCH_T + dt, n = o === null ? 0 : o < 0 ? o - tongueHalf(t) : tongueHalf(t) + o;
        moonStones.push({ x: TIP[0] + TDIR[0] * t + Math.SQRT1_2 * n, z: TIP[1] + TDIR[1] * t + Math.SQRT1_2 * n, r, sy: hh / (1.28 * r), wood: true, moon: true });
      }
    }
    await ctx.yield();

    // ---- (3) the sea: long level strokes lying on the water, canvas between them ----
    {
      const seaCol = () => {
        const r = rng();
        if (hour === 'one') return pg.pale;
        if (hour === 'afterglow') return r < 0.42 ? pg.pale : r < 0.78 ? pg.ultra : r < 0.97 ? pg.pink : pg.madder;
        return r < 0.54 ? pg.pale : r < 0.97 ? pg.ultra : pg.pink;
      };
      const many = (hour === 'one' ? 0.72 : 1) * (windy ? 1.7 : 1) * (0.75 + 0.25 * detail) * (0.85 + 0.15 * density);
      const shorten = windy ? 0.45 : 1;
      const sway = () => [rng.range(0.5, 1.5), rng.range(80, 200), rng.range(0, 6.28), rng.range(0.8, 1.5) * (rng.chance(0.5) ? 1 : -1)];
      // water limits at a given z (brief frame): from the home shore to the east shore, the tongue cut out
      const span = (z, x) => {
        let lo = shoreX(z) + 5, hi = eastX(z) - 7;
        if (z > 600 && z < 890) { const sw = 877 - z, ne = 966 - z; if (ne < hi - 40 && x > 921 - z) lo = Math.max(lo, ne); else hi = Math.min(hi, sw); }
        return [lo, hi];
      };
      // (a) cross bands: level, swung in one shallow bow, wider with distance down the fjord
      const nCross = Math.round(250 * many);
      for (let i = 0; i < nCross; i++) {
        const f = rng(), z = -260 + 2000 * f;
        const wide = sm(120, 700, z);
        const half = lerp(rng.range(1.1, 4.2), rng.range(5, 12.5), wide) * (z > 1000 ? 1.3 : 1);
        const len = Math.max(60, lerp(rng.range(70, 240), rng.range(180, 760), wide) * shorten);
        const xc = lerp(shoreX(z) + 20, eastX(z) - 20, rng());
        const [lo, hi] = span(z, xc);
        const x0 = Math.max(lo, xc - len / 2), x1 = Math.min(hi, xc + len / 2);
        if (x1 - x0 < 40) continue;
        const N = Math.max(4, Math.ceil((x1 - x0) / 24)), bow = rng.range(-7, 7) * (0.5 + wide), tilt = rng.range(-0.02, 0.02), dir = rng.chance(0.5), pts = [];
        for (let k = 0; k <= N; k++) { const t = dir ? k / N : 1 - k / N, x = lerp(x0, x1, t); pts.push(P(x, 0.03, z + bow * 4 * t * (1 - t) + tilt * (x - xc))); }
        const col = seaCol(), warm = col === pg.pink || col === pg.madder;
        bands.push({ pts, half: warm ? Math.min(half, col === pg.madder ? 1.6 : 4.2) : half, color: col, seed: rng(), dry: rng.range(-0.12, 0.32), margin: Math.min(8, (x1 - x0) * 0.08), wave: sway(), order: rng() });
      }
      await ctx.yield();
      // (b) shore bands: offsets of the S, close under the strand and through the shallows
      const nShore = Math.round(100 * many);
      for (let i = 0; i < nShore; i++) {
        const z0 = rng.range(-260, 1150), off = 3 + 62 * Math.pow(rng(), 1.6), len = Math.max(60, rng.range(70, 330) * shorten), dir = rng.chance(0.5), pts = [];
        const half = rng.range(0.9, 2.6) * (1 + off / 40) * (1 + sm(300, 800, z0));
        const N = Math.max(4, Math.ceil(len / 11)), ph = rng.range(0, 6.28);
        for (let k = 0; k <= N; k++) { const t = dir ? k / N : 1 - k / N, z = z0 + len * t; pts.push(P(shoreX(z) + off * (1 + 0.1 * Math.sin(z * 0.02 + ph)), 0.035, z)); }
        const c = off < 9 && rng.chance(0.3) ? pg.pink : seaCol();
        const bnd = { pts, half, color: c, seed: rng(), dry: rng.range(-0.15, 0.3), margin: 5, wave: sway(), order: rng() };
        bnd.keep = true; if (off < 7) bands.push(bnd);                 // (night pass) only close under the strand: out on the water every band lies level
      }
      // (c) beyond the jetty: offsets of the course, running in to the foot of the pillar
      const nCourse = Math.round(9 * many);
      for (let i = 0; i < nCourse; i++) {
        const z0 = rng.range(430, PZ - 80), off = rng.range(-75, 75), len = Math.min(rng.range(90, 300) * shorten, PZ - 8 - z0), dir = rng.chance(0.7), pts = [];
        if (len < 40) continue;
        const N = Math.max(4, Math.ceil(len / 14));
        for (let k = 0; k <= N; k++) { const t = dir ? k / N : 1 - k / N, z = z0 + len * t; pts.push(P(off * (1 - 0.55 * sm(430, PZ + 10, z)), 0.04, z)); }
        void [rng.range(1.6, 4.6), seaCol(), rng(), rng.range(-0.1, 0.3), sway(), rng()];      // (night pass) not laid: no streaks along the course
      }
      // (d) weed in the shallows: a few green-black strokes lying along the bands
      for (let i = 0; i < 9; i++) {
        const z = rng.range(30, 330), x0 = shoreX(z) + rng.range(8, 50), len = rng.range(18, 55), pts = [];
        for (let k = 0; k <= 5; k++) pts.push(P(x0 + len * k / 5, 0.05, z + rng.range(-0.6, 0.6)));
        const wb = { pts, half: rng.range(0.5, 1.1) * 0.6, color: pg.wood, seed: rng(), dry: rng.range(0.1, 0.4), margin: 2, wave: sway(), order: 2 };
        if (!pts.some((q) => underEye(q[0], q[2], 30))) bands.push(wb);      // (lane pass) none under the low course: seen from 4 m one reads as a dark sliver
      }
      // (e) near marks over the open water and under the last approach: short thin level strokes
      const nNear = Math.round(120 * (many / (windy ? 1.7 : 1)));
      for (let i = 0; i < nNear; i++) {
        const z = rng.range(240, PZ + 60), xc = rng.range(-75, 75), len = Math.max(60, rng.range(50, 170) * shorten), N = Math.max(3, Math.ceil(len / 14)), bow = rng.range(-3, 3), pts = [];
        for (let k = 0; k <= N; k++) { const t = k / N; pts.push(P(xc + len * (t - 0.5), 0.045, z + bow * 4 * t * (1 - t))); }
        bands.push({ pts, half: rng.range(0.8, 2.7), color: seaCol(), seed: rng(), dry: rng.range(-0.1, 0.3), margin: 4, wave: sway(), order: rng() });
      }
      { // (gold pass) the shallows under the eye: thin level strokes over the broad bands, so no one band is the lower third of a frame
        const nThin = Math.round(560 * (0.7 + 0.3 * detail));
        for (let i = 0; i < nThin; i++) {
          const z = grng.range(-90, 770), lx = lowX[Math.min(179, Math.max(0, Math.round((z - Z0) / 5)))], xc = SX * (lx > 1e5 ? lerp(0, -27, sm(60, 250, z)) * SX : lx) + grng.range(-46, 46) * (0.25 + 0.75 * grng()), len = grng.range(18, 80), N = Math.max(3, Math.ceil(len / 12)), bow = grng.range(-1.2, 1.2), r = grng(), pts = [];
          for (let k = 0; k <= N; k++) { const t = k / N; pts.push(P(xc + len * (t - 0.5), 0.05, z + bow * 4 * t * (1 - t))); }
          const col = hour === 'one' ? (r < 0.6 ? pg.ultra : r < 0.85 ? pg.pink : pg.wood) : r < 0.46 ? pg.pale : r < 0.7 ? pg.ultra : r < 0.9 ? pg.pink : pg.wood;
          bands.push({ pts, half: grng.range(0.22, 0.8) * (col === pg.wood ? 0.6 : 1), color: col, seed: grng(), dry: grng.range(-0.2, 0.3), margin: 2, wave: [grng.range(0.2, 0.6), grng.range(60, 140), grng.range(0, 6.28), grng.range(0.6, 1.2)], order: 1 + grng() });
        }
      }
      const nExit = Math.round(60 * (many / (windy ? 1.7 : 1)));
      for (let i = 0; i < nExit; i++) {
        const t0 = rng.range(-30, 190), o = rng.range(40, 135), len = Math.max(60, rng.range(50, 150) * shorten), N = Math.max(3, Math.ceil(len / 14)), bow = rng.range(-3, 3), pts = [];
        const xc = TIP[0] + TDIR[0] * t0 + Math.SQRT1_2 * o, zc = TIP[1] + TDIR[1] * t0 + Math.SQRT1_2 * o;      // level, like every band of the sea
        for (let k = 0; k <= N; k++) { const t = k / N; pts.push(P(xc + len * (t - 0.5), 0.045, zc + bow * 4 * t * (1 - t))); }
        bands.push({ pts, half: rng.range(0.8, 2.6), color: seaCol(), seed: rng(), dry: rng.range(-0.1, 0.3), margin: 4, wave: sway(), order: rng() });
      }
      // (f) (night pass) THE NIGHT SEA, laid almost full: long swaying bands side by side from shore to shore, the deeper
      // ultramarine for most of the near and middle water, paler and wider with distance down the fjord. They lie level
      // to the picture wherever the eye is: rows across the fjord; round the pillar, rings (its echo, as round every
      // form); in the bay beyond the tongue, rows along the tongue's shore, square to the last approach. Canvas is left
      // only as the thin dry gaps where two bands miss each other, where a stroke runs dry, and between the goes.
      {
        const thin = 0.8 + 0.2 * detail, lean = hour === 'one' ? 0.9 : 1, RING = 235;      // (one in the morning: all of it the pale violet, a little more canvas between)
        const kindAt = (x, z) => {
          const n = (x + z - 921) * Math.SQRT1_2, t = ((x - 79) - (z - 842)) * Math.SQRT1_2;
          return n > 0 && n < 262 && t > -70 && t < 335 ? 2 : Math.hypot(x, z - PZ) < RING ? 1 : 0;
        };
        for (let i = bands.length - 1; i >= 0; i--) {        // the level strokes laid earlier keep out of the rings and the bay
          const b = bands[i], m = b.pts[b.pts.length >> 1];
          if (!b.keep && (b.color === pg.pale || b.color === pg.ultra) && kindAt(SX * m[0], m[2]) !== 0) bands.splice(i, 1);
        }
        let nLines = 0;
        // one line of the sea: fn(s) -> [x, z] for s metres along it; laid in goes wherever it is open water of its own kind
        const layLine = async (fn, S, step, kind, pitch, far, under, warm = 0) => {
          let pts = [], len = 0, want = 0, fresh = true;
          const newWant = (z) => Math.max(60, frng.range(150, 430) * Math.max(shorten, 0.7) * (kind === 0 ? 1 + 0.6 * sm(120, 900, z) : 1));
          // a go ends either because it is long enough (the next one starts 16 to 30 m back, over its dry tail) or because it
          // has reached a shore or the edge of its water (then its loaded head lies there)
          const flush = (edge) => {
            let carry = null, cl = 0;
            if (!edge && pts.length >= 3) {
              const back = frng.range(16, 30); let i = pts.length - 1;
              while (i > 0 && cl < back) { cl += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]); i--; }
              carry = pts.slice(i);
            }
            if (pts.length >= 3 && len > 14) {
              const r = frng(), col = hour === 'one' ? pg.pale : hour === 'afterglow' && r > 0.9 && !under ? pg.pink : (warm > 0 && grng() < warm) ? pg.pink : r < far * (under ? 0.6 : 1) && !pts.some((p) => underEye(p[0], p[2], 24)) ? pg.pale : pg.ultra;      // (gold pass) no pale band under the low course: the lower third of a frame is deep water
              const rev = edge ? (fresh ? frng.chance(0.5) : true) : (fresh ? false : frng.chance(0.5));
              bands.push({ pts: rev ? pts.reverse() : pts, half: pitch * (under ? frng.range(0.56, 0.7) : frng.range(0.5, 0.63)) * lean * (col === pg.pink ? 0.7 : 1), color: col, seed: frng(),
                dry: frng.range(-0.62, -0.3), margin: Math.min(4, len * 0.05),      // loaded: seen close the band keeps its body
                wave: [frng.range(0.4, 1.3), frng.range(80, 200), frng.range(0, 6.28), frng.range(0.8, 1.5) * (frng.chance(0.5) ? 1 : -1)], order: (under ? -1.6 : -1) + 0.5 * frng() });
            }
            if (!carry) { pts = []; len = 0; fresh = true; return; }
            pts = carry; len = cl; fresh = false; want = newWant(pts[0][2]);
          };
          // its water: from under the strand of one shore to under the strand of the other, inside its own kind of sea
          const okAt = (sA) => { const [x, z] = fn(sA); return x > shoreX(z) - 5 && x < eastX(z) + 5 && kindAt(x, z) === kind; };
          const add = (sA) => {
            const [x, z] = fn(sA), q = P(x, 0.028, z);
            if (!pts.length) want = newWant(z) * (fresh ? frng.range(0.35, 1) : 1);
            else len += Math.hypot(q[0] - pts[pts.length - 1][0], q[2] - pts[pts.length - 1][2]);
            pts.push(q);
          };
          let was = false, sPrev = 0;
          for (let sA = 0; sA < S + step; sA += step) {
            const sC = Math.min(sA, S), is = okAt(sC);
            if (is !== was && sA > 0) {               // the edge of its water lies between the last sample and this one
              let a = sPrev, b = sC;
              for (let k = 0; k < 4; k++) { const m = (a + b) / 2; if (okAt(m) === was) a = m; else b = m; }
              if (is) add(b); else { add(a); flush(true); }
            }
            if (is) { add(sC); if (len >= want) flush(false); }
            was = is; sPrev = sC;
          }
          flush(true);
          ++nLines; await ctx.yield();
        };
        // rows across the fjord
        for (let z = -520; z < 2150;) {
          const pitch = (5.4 + 22 * sm(950, 2100, z)) / thin, wide = sm(120, 900, z);
          const lo = shoreX(z) - 4, W = eastX(z) - lo, bow = frng.range(-2.5, 2.5) * (0.5 + wide), tilt = frng.range(-0.012, 0.012), zr = z + frng.range(-0.22, 0.22) * pitch, x0 = frng.range(0, 5);
          for (const un of [1, 0]) await layLine((sA) => { const t = sA / W; return [lo + x0 * (1 - un) + sA, zr + un * pitch * 0.5 + bow * 4 * t * (1 - t) + tilt * sA]; }, W, z > -300 && z < 1150 ? 11 : 22, 0, pitch, 0.14 + 0.56 * sm(900, 1700, z), !!un);
          z += pitch;
        }
        // rings round the pillar
        for (let r = 15; r < RING;) {
          const pitch = 5.4 / thin, a0 = frng.range(0, 6.28), ph = frng.range(0, 6.28), rr = r + frng.range(-0.2, 0.2) * pitch;
          for (const un of [1, 0]) await layLine((sA) => { const a = a0 + un * 2 + sA / rr, q = (rr + un * pitch * 0.5) * (1 + 0.012 * Math.sin(a * 3 + ph)); return [Math.sin(a) * q, PZ + Math.cos(a) * q]; }, 6.2832 * rr, r < 70 ? 5 : 8, 1, pitch, 0.16, !!un, un || hour === 'one' ? 0 : 0.5 * (1 - sm(34, 120, r)));
          r += pitch;
        }
        // rows along the tongue's shore, in the bay
        for (let n = 3; n < 262;) {
          const pitch = 5.4 / thin, nn = n + frng.range(-0.2, 0.2) * pitch, bow = frng.range(-2, 2);
          for (const un of [1, 0]) await layLine((sA) => { const t = sA / 405, o = nn + un * pitch * 0.5 + bow * 4 * t * (1 - t); return [TIP[0] + TDIR[0] * (sA - 70) + Math.SQRT1_2 * o, TIP[1] + TDIR[1] * (sA - 70) + Math.SQRT1_2 * o]; }, 405, 11, 2, pitch, 0.1, !!un);
          n += pitch;
        }
      }
      await ctx.yield();
      // (gold pass) no broad pale band lies under the low course (seen from 2.5 m up one band is the lower third of the frame
      // and reads as bare ground): there the broad bands are the deep ultramarine, and the pale is in thin strokes over them
      if (hour !== 'one') for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        if (b.color === pg.pale && b.half > 1.1 && b.pts.some((p) => underEye(p[0], p[2], 22))) b.color = pg.ultra;
        if ((i % 400) === 399) await ctx.yield();
      }
      bands.sort((a, b) => a.order - b.order);
      await ctx.yield();
      // wide bands are built at a third of their size and scaled up, so the stroke's lanes, wobble and ragged ends
      // are in proportion to a band 20 m wide seen half a kilometre off
      const CS = 3, fine = [], coarse = [];
      for (const b of bands) {
        if (b.half < 4.4) { fine.push(b); continue; }
        const w = b.wave || [0, 100, 0, 0];
        coarse.push({ ...b, pts: b.pts.map((p) => [p[0] / CS, p[1] / CS, p[2] / CS]), half: b.half / CS, margin: (b.margin ?? 4) / CS, wave: [w[0] * 2.4 / CS, w[1] * 1.5 / CS, w[2], w[3]] });
      }
      await ctx.yield();
      const seaC = new THREE.Mesh(await strokeGeometry(coarse, ctx.yield), bandMatC); seaC.scale.setScalar(CS); seaC.renderOrder = 9; seaC.frustumCulled = false; scene.add(seaC);
      const sea = new THREE.Mesh(await strokeGeometry(fine, ctx.yield), bandMat); sea.renderOrder = 10; sea.frustumCulled = false; scene.add(sea);
    }
    await ctx.yield();

    // ---- (5b) the boulders: rounded shore stones, pink and pale (pale is the bare canvas), each with its contour, ----
    // ---- its one shade stroke and its echo line lying round it on the water ----
    const rocks = solidBuilder(), marks = [], drips = [];
    const HERO_ROCK = { x: -5.7, z: 69, r: 2.7 };        // the boulder the first laying stroke goes round (brief frame)
    {
      // templates with shared vertices (the kit's icosahedron repeats each corner six times)
      const tmpl = [];
      for (const d of [1, 2, 3]) {
        const a = new THREE.IcosahedronGeometry(1, d).getAttribute('position').array, seen = new Map(), verts = [], index = [];
        for (let k = 0; k < a.length; k += 3) {
          const key = Math.round(a[k] * 1e4) + ',' + Math.round(a[k + 1] * 1e4) + ',' + Math.round(a[k + 2] * 1e4);
          let i = seen.get(key); if (i === undefined) { i = verts.length / 3; seen.set(key, i); verts.push(a[k], a[k + 1], a[k + 2]); }
          index.push(i);
        }
        tmpl.push({ verts, index });
        await ctx.yield();
      }
      await ctx.yield();
      const list = [];
      list.push({ x: 2.3, z: Z0 + 15, r: 1.25, near: true }, { x: -3.4, z: Z0 + 31, r: 1.0, near: true }, { x: 4.6, z: Z0 + 44, r: 1.6, near: true },
        { x: -6.5, z: Z0 + 22, r: 1.9, near: true }, { x: 7.5, z: Z0 + 74, r: 2.2, near: true }, { ...HERO_ROCK, near: true },
        // cut by the bottom edge of the first frames, a metre from the eye
        { x: -2.15, z: Z0 + 11.4, r: 1.0, near: true }, { x: 2.5, z: Z0 + 33.4, r: 1.2, near: true }, { x: -2.0, z: Z0 + 32.6, r: 0.9, near: true });
      // skerries (polish pass): heaps of the same shore stones standing in the open water beside the course, from the
      // jetty's head toward the foot of the pillar
      const SKERRY = [{ x: 0, z: 452, n: 8, R: 6.5 }, { x: -33, z: 512, n: 9, R: 9 }, { x: 2.5, z: 574, n: 8, R: 7 }, { x: -21, z: 632, n: 8, R: 9 }, { x: 31, z: 662, n: 7, R: 9 }, { x: -30, z: 902, n: 9, R: 10 }, { x: 24, z: 975, n: 6, R: 8 }];
      const skerry = [];
      for (const S of SKERRY) for (let k = 0; k < S.n; k++) {
        const a = prng.range(0, 6.28), d = S.R * Math.sqrt(prng());
        skerry.push({ x: S.x + Math.cos(a) * d * 0.7, z: S.z + Math.sin(a) * d * 1.4, r: k < 2 ? prng.range(2.6, 4.2) : prng.range(0.7, 2.3), sk: true });
      }
      const nRock = Math.round(294 * (0.7 + 0.3 * detail));
      for (let i = 0; i < nRock; i++) {
        const tongue = i >= nRock - 34;            // the tongue's foot, either side of the notch
        let x, z;
        if (tongue) {
          const t = NOTCH_T + (rng.chance(0.5) ? 1 : -1) * rng.range(FOOT_T[0], FOOT_T[1]), o = rng.range(FOOT_N[0], FOOT_N[1]);
          x = TIP[0] + TDIR[0] * t + Math.SQRT1_2 * o; z = TIP[1] + TDIR[1] * t + Math.SQRT1_2 * o;
        } else if (i % 5 === 0) { z = rng.range(Z0 - 25, 200); x = rng.range(-13, 16); }      // straddling the course at the entry
        else { z = rng.range(Z0 - 60, 318); x = shoreX(z) - 5 + 78 * Math.pow(rng(), 1.5); }
        const r = tongue ? rng.range(0.9, 2.4) : 0.3 + 2.2 * Math.pow(rng(), 2.4);
        list.push({ x, z, r, tongue });
      }
      list.push(...skerry, ...isletLobes,
        // stones under the eye where the first laying stroke overtakes (u 0.08), cut by the bottom edge
        { x: 3.3, z: 57, r: 1.3, sk: true }, { x: 5.6, z: 70, r: 1.9, sk: true }, { x: -2.6, z: 55.5, r: 0.7, sk: true }, { x: 2.4, z: 79, r: 1.0, sk: true }, { x: -9.5, z: 60, r: 1.4, sk: true },
        ...moonStones);
      // (night pass) shore stones under the wood's headland, where the course crosses under it: at arm's length
      list.push({ x: -12.3, z: 180, r: 1.3, sk: true, moon: true }, { x: -21.6, z: 184, r: 1.7, sk: true, moon: true }, { x: -13.6, z: 189.5, r: 1.0, sk: true, moon: true }, { x: -9, z: 197, r: 2.2, sk: true, moon: true },
        { x: -26, z: 450, r: 1.4, sk: true, moon: true }, { x: -29.5, z: 457, r: 1.1, sk: true, moon: true }, { x: -38, z: 452, r: 1.6, sk: true, moon: true }, { x: -41.5, z: 458, r: 1.0, sk: true, moon: true }, { x: -33, z: 467, r: 2.0, sk: true, moon: true });
      list.push({ x: -62.5, z: 715, r: 1.5, sk: true, moon: true }, { x: -61, z: 722.5, r: 1.1, sk: true, moon: true }, { x: -63.5, z: 730, r: 1.9, sk: true, moon: true }, { x: -75.5, z: 717, r: 1.2, sk: true, moon: true });
      list.push({ x: -64.3, z: 699, r: 1.3, sk: true, moon: true }, { x: -72, z: 702.5, r: 1.6, sk: true, moon: true }, { x: -63.2, z: 707, r: 0.9, sk: true, moon: true }, { x: -71, z: 710, r: 1.1, sk: true, moon: true },      // (gold pass) under the eye at u 0.52
        { x: 3.6, z: 53.5, r: 1.1, sk: true, moon: true }, { x: -3.2, z: 62, r: 0.8, sk: true, moon: true },
        // big stones to starboard where the first laying stroke overtakes (u 0.08): the pillar stands between two heaps of boulders
        { x: 8.6, z: 64, r: 3.3, sk: true, moon: true, pk: true }, { x: 13.5, z: 72.5, r: 3.9, sk: true, moon: true }, { x: 6.2, z: 76.5, r: 1.7, sk: true, moon: true }, { x: 15.5, z: 60.5, r: 1.5, sk: true, moon: true, pk: true }, { x: -11.8, z: 76, r: 2.1, sk: true, moon: true });
      // (slim pass) a heap of shore stones at arm's length under the wood's wall (u 0.16), to starboard of the course
      list.push({ x: -26.5, z: 169, r: 1.7, sk: true, moon: true, pk: true }, { x: -21.5, z: 174, r: 2.4, sk: true, moon: true }, { x: -30.8, z: 178, r: 1.2, sk: true, moon: true }, { x: -18.5, z: 166, r: 1.1, sk: true, moon: true }, { x: -24.5, z: 183, r: 1.6, sk: true, moon: true, pk: true }, { x: -15.5, z: 178, r: 1.5, sk: true, moon: true }, { x: -27.5, z: 190, r: 2.0, sk: true, moon: true });
      for (const [sj, oj, rj, pk] of [[44, 12.5, 1.9, 1], [50, 16.5, 1.3, 0], [57, 11.8, 1.1, 0], [63, 15, 2.4, 1], [71, 12.6, 1.4, 0], [39, 17, 1.0, 1], [84, 14, 1.7, 0]]) { const q = JP(sj, oj, 0); list.push({ x: q[0], z: q[2], r: rj, sk: true, moon: true, pk: !!pk }); }      // and a few off the jetty's open side
      list.push({ x: -53.2, z: 579, r: 1.5, sk: true, moon: true }, { x: -62.8, z: 575, r: 1.25, sk: true, moon: true }, { x: -56, z: 592, r: 2.0, sk: true, moon: true }, { x: -65.5, z: 560, r: 1.7, sk: true, moon: true });
      for (let k = 0, n = Math.round(40 * (0.7 + 0.3 * detail)); k < n; k++) {      // (gold pass) stones under the rise over the shallows, each in its echo ring as seen from above
        const z = grng.range(172, 266), lx = lowX[Math.round((z - Z0) / 5)]; list.push({ x: (lx > 1e5 ? SX * lerp(-13, -27, sm(160, 250, z)) : lx) * SX + grng.range(-30, 34), z, r: 0.5 + 2.1 * Math.pow(grng(), 1.6), sk: true, moon: true });
      }
      for (let k = 0, n = Math.round(46 * (0.7 + 0.3 * detail)); k < n; k++) {
        const z = frng.range(452, 645); list.push({ x: shoreX(z) - 2 + 27 * Math.pow(frng(), 1.6), z, r: 0.4 + 2.1 * Math.pow(frng(), 2), sk: true, moon: true });
      }
      { // (lane pass) a heap of big shore stones at arm's length to starboard where the first laying stroke overtakes (u 0.08)
        const rs = ctx.rng.fork('white-night-near');
        list.push({ x: 7.4, z: 56, r: 2.5, sk: true, pk: true, rs, sy: 0.98 }, { x: 11.2, z: 61, r: 2.4, sk: true, rs, sy: 0.9 }, { x: 6.2, z: 62.5, r: 1.3, sk: true, rs }, { x: 12.5, z: 53.5, r: 1.5, sk: true, pk: true, rs }, { x: 9.2, z: 50.5, r: 0.9, sk: true, rs });
      }
      { // (polish 1, additions 2 and 3) big shore stones, pink and pale, in two places the shore itself gives. Each thing
        // draws from a stream of its own; every stone takes its draws in the loop below from that stream.
        // KEEP-OUT FROM THE COURSE, for every stone of this block: one whose centre is nearer the course in plan than 1.2
        // times its radius plus 2.5 m is not laid (the corridor law below starts at 1.2 radii plus 1.2 m by the path's own
        // coarser samples: 1.3 m more, a plain number, so it never bites a stone of this block)
        const offCourse = (s) => clearOfRoute(s.x, s.z, 1.2 * s.r + 2.5);
        // (addition 2) THE BAR ACROSS THE BAY'S MOUTH: a broken line of big round-backed shore stones across the mouth of
        // the first bay, ending in a heap against the jetty's landing on its open side. The bar lies on the straight line
        // from the shore curve's knot at z 0 to the jetty's root: the chord of the bay. A station every 26 to 36 m of it
        // (drawn), the first 12 m beyond the knot (plain numbers); each stone lies to seaward of the line by -4 m (plain)
        // plus the bar's breadth times a draw to the power 1.5, the power of the shore's own boulder law; the breadth is a
        // quarter of the jetty's length. Radius 1.7 to 2.5 m (plain), round backs as the near heap above has, pink by a coin.
        const rs = ctx.core.makeRng(ctx.core.hashSeed('white-night-bar:' + ctx.seed));
        const K0 = [shoreX(0), 0], bl = Math.hypot(JA[0] - K0[0], JA[1] - K0[1]), bd = [(JA[0] - K0[0]) / bl, (JA[1] - K0[1]) / bl], bn = [bd[1], -bd[0]];      // the knot; the chord's length; along it; across it, to seaward
        const BAR_B = JL / 4;                             // the bar's breadth: a quarter of the jetty's length
        const bar = [];
        for (let s = 12; s < bl; s += rs.range(26, 36)) {
          const o = -4 + BAR_B * Math.pow(rs(), 1.5);
          bar.push({ x: K0[0] + bd[0] * s + bn[0] * o, z: K0[1] + bd[1] * s + bn[1] * o, r: rs.range(1.7, 2.5), sy: rs.range(0.82, 0.98), sk: true, pk: rs.chance(0.5), rs });
        }
        // the landing: four stones along the jetty's ramp and wide landing, at -16, 0, 16 and 31 m from its root (plain
        // numbers; the ramp begins 18 m short of the root and the landing has narrowed to the deck by 30 m), each 3 m either
        // way (drawn), on the open side just outside the strip kept clear under the jetty (the strip ends 9.5 m plus the
        // radius off the axis: 10 m plus the radius plus a drawn 0.5 to 5 m), small and large by turns
        for (let k = 0; k < 4; k++) {
          const sj = [-16, 0, 16, 31][k] + rs.range(-3, 3), r = k % 2 ? rs.range(1.9, 2.4) : rs.range(1.0, 1.5), q = JP(sj, 10 + r + rs.range(0.5, 5), 0);
          bar.push({ x: q[0], z: q[2], r, sy: rs.range(0.82, 0.98), sk: true, pk: rs.chance(0.5), rs });
        }
        // KEEP OFF THE HAND: the first laying stroke runs up this bay. Its way is rebuilt here as plan points (brief frame)
        // from the same boulder and the same jetty root, knot for knot as the stroke itself is built further down; the
        // stroke is not touched. A stone whose centre lies within its radius plus 2 m (plain) of that way is not laid
        const hand = [];
        { const C = HERO_ROCK, R = C.r * 1.12 + 1.9, way = [[-9, C.z - 198], [-8.5, C.z - 148], [-8, C.z - 88], [-7.4, C.z - 33], [-6.4, C.z - 15]];
          for (let a = -75; a <= 75; a += 25) { const r = a * Math.PI / 180; way.push([C.x + Math.cos(r) * R, C.z + Math.sin(r) * R]); }
          way.push([-11, C.z + 11], [-15.5, C.z + 40], [-19, 130], [-26, 170], [-34, 210], [-39, 238], [JA[0] - 2.5, 258]);
          const cv = new THREE.CatmullRomCurve3(way.map((p) => new THREE.Vector3(p[0], 0.1, p[1])), false, 'centripetal'), nH = Math.max(4, Math.ceil(cv.getLength() / 2.2)), hv = new THREE.Vector3();
          for (let i = 0; i <= nH; i++) { cv.getPointAt(i / nH, hv); hand.push(hv.x, hv.z); } }
        const offHand = (s) => { for (let i = 0; i < hand.length; i += 2) if (Math.hypot(hand[i] - s.x, hand[i + 1] - s.z) < s.r + 2) return false; return true; };
        for (const s of bar) {
          if (!offHand(s)) continue;
          if (!offCourse(s)) continue;
          list.push(s);
        }
        await ctx.yield();
        // (addition 3) THE BIG SHORE STONES AT THE TONGUE'S FOOT: two heaps of large rounded shore stones in the bay either
        // side of the notch, three on the tip side and two on the wall side: the count is live's own, as live's stream
        // dealt it. Their place is the tongue's and every one of them is drawn from this block's own stream, in this
        // order, stone by stone:
        // its distance along the tongue from the notch's axis, two notch half-widths give or take what keeps it inside
        // the band of the tongue's own foot boulders (FOOT_T: 2 NW - (FOOT_T[1] - 2 NW) to FOOT_T[1], 26 to 50 m), which
        // leaves the way in open; its radius (bigR, the size of the big stones round the pillar's foot); its distance off
        // the tongue's centre line into the bay, anywhere in the foot boulders' own band that holds the whole stone
        // (FOOT_N: from its inner edge plus the radius to its outer edge less the radius); and pink by a coin.
        // A stone stands clear of every crown by its own radius plus 2 m, further than 150 m from the pillar's foot (where
        // the gold on a stone's shoulder has given out: no gold is added) and further than its radius plus the portal's
        // plus 3 m from the portal; where it would not, it stands further off the centre line by the fewest whole metres
        // that clear it, and if the band's outer edge (FOOT_N[1]) comes first it is not laid
        const bs = ctx.core.makeRng(ctx.core.hashSeed('white-night-bay-stones:' + ctx.seed));
        const crowns = list.filter((c) => c.wood);
        const stands = (s) => Math.hypot(s.x, s.z - PZ) > 150 && Math.hypot(SX * s.x - PORTAL.x, s.z - PORTAL.z) > s.r + PR + 3 && crowns.every((c) => Math.hypot(c.x - s.x, c.z - s.z) > c.r + s.r + 2);
        for (const sg of [-1, -1, -1, 1, 1]) {
          const t = NOTCH_T + sg * bs.range(2 * NW - (FOOT_T[1] - 2 * NW), FOOT_T[1]), r = bigR(bs), n0 = bs.range(FOOT_N[0] + r, FOOT_N[1] - r), pk = bs.chance(0.5);
          for (let n = n0; n <= FOOT_N[1]; n += 1) {
            const s = { x: TIP[0] + TDIR[0] * t + Math.SQRT1_2 * n, z: TIP[1] + TDIR[1] * t + Math.SQRT1_2 * n, r, sk: true, exit: true, pk, rs: bs };
            if (!stands(s)) continue;
            if (offCourse(s)) list.push(s);
            break;
          }
        }
        await ctx.yield();
      }
      const sd = new THREE.Vector3(0.8 * -SX, -0.25, -0.55).normalize();          // the side the shade stroke lies on
      const ld = new THREE.Vector3();      // (gold pass) and the side the pillar's light is laid on: one stroke of the gold over the shoulder that faces it
      const q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), nn = new THREE.Vector3();
      let done = 0;
      // (sky round, the owner's stone cure) THE ENTRY AXIS BEHIND THE ENTRY IS A SECOND COURSE. The camera that draws this
      // world inside the previous world's opening flies the level entry axis behind the route's first point before we are
      // in. offEntryAxis: plan metres from a point to that axis, a ray from the first point straight back with no end (no
      // length is typed: the shore stones' own field ends 60 m behind the entry); for a point ahead of the entry it is
      // Infinity, the course's own test holds there. The eye on that line is at the first point's height (a level axis)
      const tl0 = Math.hypot(path.startTangent.x, path.startTangent.z) || 1;
      const offEntryAxis = (x, z) => { const dx = x - path.start.x, dz = z - path.start.z, a = -(dx * path.startTangent.x + dz * path.startTangent.z) / tl0; return a <= 0 ? Infinity : Math.abs(dx * path.startTangent.z - dz * path.startTangent.x) / tl0; };
      for (const b of list) {
        const rng = b.rs || (b.moon ? mrng : rng0);       // stones added later draw from their own stream
        const wx = SX * b.x, wz = b.z;
        let r = b.r;
        const np = path.nearestXZ(wx, wz);
        const sy = b.sy ?? rng.range(0.5, 0.74) * (b.sk ? 1.3 : 1), sxz = rng.range(0.85, 1.2);
        // the corridor: under the course a stone stays 1.3 m below the eye; beside it, clear of it
        if (np.dist < r * 1.2 + 1.2) r = Math.min(r, Math.max(0.3, (np.y - 1.35) / (sy * 1.3)));
        if (offEntryAxis(wx, wz) < r * 1.2 + 1.2) r = Math.min(r, Math.max(0.3, (path.start.y - 1.35) / (sy * 1.3)));      // and under the entry axis behind the entry: the same lowering, the same 1.3 m
        if ((b.tongue || b.exit) && Math.hypot(wx - PORTAL.x, wz - PORTAL.z) < r + PR + 3) continue;
        if (!b.near && Math.hypot(b.x - HERO_ROCK.x, b.z - HERO_ROCK.z) < HERO_ROCK.r + r + 5.5) continue;
        { const js = (b.x - JA[0]) * jd[0] + (b.z - JA[1]) * jd[1], jo = (b.x - JA[0]) * jn[0] + (b.z - JA[1]) * jn[1];
          if (js > -26 && js < JL + 6 && jo > -5 - r && jo < 9.5 + r) continue; }      // not under the jetty or its shade
        const pink = rng.chance(pinkCast ? 0.68 : 0.3) || !!b.pk, c = b.wood ? pg.wood : pink ? pg.pink : pg.canvas;
        const det = b.wood ? 2 : np.dist < 34 ? (r > 1.0 ? 2 : 1) : r > 1.3 || b.pk ? 1 : 0, src = tmpl[det].verts, tix = tmpl[det].index;
        e3.set(rng.range(-0.25, 0.25), rng.range(0, 6.28), rng.range(-0.25, 0.25)); q4.setFromEuler(e3);
        const a1 = [rng.range(-2, 2), rng.range(-2, 2), rng.range(-2, 2)], a2 = [rng.range(-4, 4), rng.range(-4, 4), rng.range(-4, 4)], f1 = rng.range(0, 6.28), f2 = rng.range(0, 6.28);
        const cy = r * sy * 0.28, seed = rng() * 60, base = rocks.count;
        const dPl = Math.hypot(wx, wz - PZ) || 1, kL = (1 - sm(b.wood ? 95 : 70, b.wood ? 190 : 150, dPl)) * (r > 0.7 ? 1 : 0);
        ld.set(-wx / dPl * 0.62, 0.78, (PZ - wz) / dPl * 0.62).normalize();
        for (let k = 0; k < src.length; k += 3) {
          const px = src[k], py = src[k + 1], pz = src[k + 2];
          const d = 1 + 0.16 * Math.sin(px * a1[0] + py * a1[1] + pz * a1[2] + f1) + 0.07 * Math.sin(px * a2[0] + py * a2[1] + pz * a2[2] + f2);
          v.set(px * d * r * sxz, py * d * r * sy, pz * d * r / sxz).applyQuaternion(q4);
          nn.set(px / sxz, py / sy, pz * sxz).normalize().applyQuaternion(q4);
          const up = sm(-0.5, 1, py), shade0 = b.wood ? 0 : sm(0.05, 0.8, nn.dot(sd)) * (1 - sm(-0.1, 0.75, nn.y)) * 1.25;
          const lit = kL > 0 ? sm(b.wood ? 0.66 : 0.5, 0.97, nn.dot(ld)) * kL * 1.3 : 0, shade = lit > 0.25 && lit > shade0 ? -lit : shade0;
          rocks.v(wx + v.x, cy + v.y, wz + v.z, c, v.x + 0.45 * v.z + seed, cy + v.y + 0.3 * v.z, b.wood ? (r > 7 ? 0.17 : 0.3) * up * up * up : pink ? (b.sk ? 0.5 : 0.75) * up * up * up : 1, shade, nn.x, nn.y, nn.z);
        }
        for (let k = 0; k < tix.length; k += 3) rocks.tri(base + tix[k], base + tix[k + 1], base + tix[k + 2]);
        // its echo: an open ring on the water 0.5 to 1.2 m outside it, wandering
        if (r > 0.6 && (b.gold || b.near || (!b.wood && rng.chance(0.55)))) {      // (slim pass) one echo per stone at most, and not round every one
          const R0 = r * 1.12 + rng.range(0.45, 1.1), a0 = rng.range(0, 6.28), sweep = rng.range(4.1, 5.4), N = 16, pts = [], ph = rng.range(0, 6.28);
          for (let k = 0; k <= N; k++) { const a = a0 + sweep * k / N, rr = R0 * (1 + 0.09 * Math.sin(a * 2.3 + ph)); pts.push([wx + Math.cos(a) * rr * sxz, 0.08, wz + Math.sin(a) * rr / sxz]); }
          if (!(b === list[5])) marks.push({ pts, half: (0.04 + 0.028 * r) * (b.gold ? 2.2 : 1), color: b.gold ? pg.gold : pg.madder, seed: rng(), dry: b.gold ? -0.1 : 0.22, margin: 0.5, wave: [0.12, 30, rng.range(0, 6.28), 0.8], order: 1 });
        }
        if (false && r > 0.95) {            // (slim pass) no arc over its back: the looping lines read as illustration, as the picture sees it (square to the course)
          const R1 = r * 1.2 + rng.range(0.4, 0.8), N = 12, pts = [], sides = [], a0 = rng.range(0.1, 0.5), a1e = rng.range(2.3, 2.9);
          for (let k = 0; k <= N; k++) { const a = lerp(a0, a1e, k / N); pts.push([wx + Math.cos(a) * R1 * sxz, cy + Math.sin(a) * R1 * sy * 1.05, wz]); sides.push([Math.cos(a), Math.sin(a), 0]); }
          marks.push({ pts, half: 0.05 + 0.03 * r, side: (i) => sides[i], color: pg.madder, seed: rng(), dry: 0, margin: 0.4, wave: [0.1, 30, rng.range(0, 6.28), 0.7], order: 1 });
        }
        // its shade on the water: one short level stroke
        if (r > 0.6) {
          const len = r * rng.range(2.2, 3.6), x0 = wx - SX * r * 0.2, pts = [];
          for (let k = 0; k <= 4; k++) pts.push([x0 - SX * len * k / 4, 0.07, wz - r * 0.55 + 0.1 * k]);
          marks.push({ pts, half: r * rng.range(0.22, 0.34) * (b.wood ? 0.45 : 1), color: rng.chance(0.75) || b.wood ? pg.ultra : pg.madder, seed: rng(), dry: rng.range(0, 0.3), margin: 0.5, wave: [0.1, 40, 0, 0.7], order: 0 });
        }
        if (det >= 1 || (++done % 3) === 0) await ctx.yield();
      }
      await ctx.yield();
      const rockGeo = await rocks.geometry(ctx.yield);
      await ctx.yield();
      const rock = new THREE.Mesh(rockGeo, rockMat); rock.frustumCulled = false; scene.add(rock);
    }
    await ctx.yield();

    // ---- (5c) the jetty: the one built thing. A white diagonal of planks left as bare canvas, edged in madder, ----
    // ---- shaded underneath with one stroke of ultramarine; 46 posts 3 m apart and a single rail 2.8 m up. Empty. ----
    {
      const at = (s, o, y) => P(...JP(s, o, y));
      const wd = [SX * jd[0], 0, jd[1]], wn = [SX * jn[0], 0, jn[1]];
      // the deck: bare canvas (the weave itself); a ramp and a wide landing at the shore, 3 m wide from 55 m on
      const pos = [], idx = [], NS = 64, S0 = -18;
      for (let k = 0; k <= NS; k++) {
        const s = S0 + (JL - S0) * k / NS;
        pos.push(...at(s, -1.5, deckY(s)), ...at(s, deckEdge(s), deckY(s)));
        if (k < NS) { const o = k * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setIndex(idx);
      const deck = new THREE.Mesh(dg, canvasMaterial({ side: THREE.DoubleSide })); deck.frustumCulled = false; scene.add(deck);
      const edge = (of, yf, half, side, col, dry, s0 = S0) => {
        let s = s0;
        while (s < JL - 2) {                                    // drawn in a few goes, like everything
          const len = Math.min(rng.range(30, 70), JL - s), pts = [];
          for (let t = 0; t <= len + 0.01; t += 3) pts.push(at(s + t, of(s + t), yf(s + t)));
          marks.push({ pts, half, side, color: col, seed: rng(), dry, margin: 0.8, wave: [0.03, 40, rng.range(0, 6.28), 0.6], order: 3 });
          s += len - rng.range(-0.6, 1.5);
        }
      };
      const portO = () => -1.5, railO = () => RAIL_O, railY = () => RAIL_Y;
      edge(deckEdge, deckY, 0.14, [0, 1, 0], pg.madder, -0.3); edge(deckEdge, deckY, 0.14, wn, pg.madder, -0.3);     // the open edge, under the eye
      edge(portO, deckY, 0.12, [0, 1, 0], pg.madder, -0.1); edge(portO, deckY, 0.12, wn, pg.madder, -0.1);
      edge(railO, railY, 0.1, [0, 1, 0], pg.madder, -0.4, -1); edge(railO, railY, 0.1, wn, pg.madder, -0.4, -1);   // the rail
      { const midY = (sA) => deckY(sA) + 0.62; edge(railO, midY, 0.07, [0, 1, 0], pg.madder, -0.2, -1); edge(railO, midY, 0.07, wn, pg.madder, -0.2, -1); }      // (slim pass) and its lower bar
      // (slim pass) THE BOARDS: the deck is bare canvas ruled lengthwise into seven boards with thin madder, the lines running
      // the whole plunge of the jetty to the pillar's foot, each drawn in a few goes that miss each other; a few long dry
      // scrubs of pale, pink and ultramarine lie along single boards (thin paint dragged over the weave), and short butt
      // joints cross one board here and there
      const NB = 7, boardO = (k, sA) => lerp(-1.5, deckEdge(sA), k / NB), topY = (sA) => deckY(sA) + 0.014;
      for (let k = 1; k < NB; k++) edge((sA) => boardO(k, sA) + 0.03 * Math.sin(sA * 0.21 + k), topY, 0.034, wn, k % 3 === 0 ? pg.ultra : pg.madder, 0.05);
      for (let k = 0; k < 16; k++) {
        const b = prng.int(0, NB - 1), s0 = prng.range(S0 + 2, JL - 30), len = prng.range(18, 60), r = prng(), pts = [];
        for (let t = 0; t <= len; t += 4) pts.push(at(Math.min(JL - 0.6, s0 + t), boardO(b + 0.5, s0 + t) + 0.05 * Math.sin(t * 0.3 + k), deckY(s0 + t) + 0.011));
        marks.push({ pts, half: prng.range(0.13, 0.26), side: wn, color: r < 0.4 ? pg.pale : r < 0.75 ? pg.pink : pg.ultra, seed: prng(), dry: prng.range(0.3, 0.5), margin: 1.5, order: 2.9 });
      }
      await ctx.yield();
      marks.push({ pts: [at(JL, -1.5, DECK_Y + 0.01), at(JL, 0.7, DECK_Y + 0.01), at(JL, 2.9, DECK_Y + 0.01)], half: 0.13, color: pg.madder, seed: rng(), dry: -0.3, margin: 0.2, order: 3 });
      await ctx.yield();
      const nPost = Math.floor((JL - 0.6) / 3) + 1;
      for (let k = 0; k < nPost; k++) {                        // posts 3 m apart: two crossed ribbons each, so they never go edge-on
        const s = 0.6 + 3 * k, lean = rng.range(-0.05, 0.05), top = RAIL_Y + rng.range(-0.04, 0.14), pts = [];
        for (let j = 0; j <= 4; j++) { const y = lerp(top, -0.4, j / 4); pts.push(at(s + lean * y, RAIL_O, y)); }       // laid from the rail down
        const sd0 = rng();
        marks.push({ pts, half: 0.12, side: wd, color: pg.madder, seed: sd0, dry: -0.45, margin: 0.15, order: 3 });
        marks.push({ pts, half: 0.12, side: wn, color: pg.madder, seed: sd0 + 0.31, dry: -0.45, margin: 0.15, order: 3 });
        const nd = rng.int(1, 3);                                // runs from the deck's lower edges and the rail
        for (let j = 0; j < nd; j++) {
          const sr = s + rng.range(-1.4, 1.4), port = rng.chance(0.45), q = at(sr, port ? -1.53 : deckEdge(sr) + 0.03, port && rng.chance(0.4) ? RAIL_Y - 0.02 : DECK_Y - 0.02);
          drips.push({ x: q[0], y: q[1], z: q[2], width: rng.range(0.15, 0.3), length: rng.range(0.5, 1.9), seed: rng(), at: rng.range(0, 0.45), color: rng.chance(0.7) ? pg.madder : pg.ultra });
        }
      }
      await ctx.yield();
      // the old pilings (polish pass): the jetty's line goes on beyond its head as two rows of leaning stumps, lower
      // and sparser toward the pillar, with the course between them; each with its one shade stroke on the water
      for (let sp = JL + 3.5; sp < JL + 150; sp += prng.range(3.2, 6.2) * (1 + sm(JL + 60, JL + 150, sp))) {
        for (const o of [-1.6, 3.1]) {
          if (prng.chance(0.2 + 0.3 * sm(JL + 50, JL + 150, sp))) continue;
          const tall = (o < 0 ? prng.range(1.7, 3.5) : prng.range(0.9, 2.4)) * (1 - 0.45 * sm(JL + 20, JL + 150, sp));
          const lx = prng.range(-0.1, 0.1), lo = prng.range(-0.08, 0.08), oo = o + prng.range(-0.35, 0.35), pts = [];
          for (let j = 0; j <= 4; j++) { const y = lerp(tall, -0.4, j / 4); pts.push(at(sp + lx * y, oo + lo * y, y)); }
          const sd0 = prng(), hw = prng.range(0.13, 0.2);
          marks.push({ pts, half: hw, side: wd, color: pg.madder, seed: sd0, dry: -0.45, margin: 0.15, order: 3 });
          marks.push({ pts, half: hw, side: wn, color: pg.madder, seed: sd0 + 0.31, dry: -0.45, margin: 0.15, order: 3 });
          const q0 = at(sp, oo + 0.2, 0.07), q1 = at(sp + 0.4, oo + prng.range(2.2, 4.5), 0.07);
          marks.push({ pts: [q0, [(q0[0] + q1[0]) / 2, 0.07, (q0[2] + q1[2]) / 2], q1], half: prng.range(0.18, 0.3), color: pg.ultra, seed: prng(), dry: 0.1, margin: 0.3, order: 0 });
        }
      }
      // butt joints: each crosses one board, none quite square
      for (let sA = S0 + 1.5; sA < JL - 0.5; sA += rng.range(1.3, 2.6)) {
        const b = rng.int(0, NB - 1), skew = rng.range(-0.08, 0.08), y = deckY(sA) + 0.015;
        marks.push({ pts: [at(sA - skew, boardO(b, sA) + 0.03, y), at(sA, boardO(b + 0.5, sA), y), at(sA + skew, boardO(b + 1, sA) - 0.03, y)], half: rng.range(0.03, 0.045), color: rng.chance(0.5) ? pg.ultra : pg.madder,
          seed: rng(), dry: rng.range(-0.1, 0.2), margin: 0.1, order: 3 });
      }
      // (slim pass) the piles under the open edge, standing in the water with their strokes: every 5 m or so, a few of them
      // mooring posts that stand above the deck; each with its one shade stroke lying on the water
      for (let sp = 2; sp < JL - 1; sp += prng.range(4.2, 6.2)) {
        const tall = prng.chance(0.3) ? DECK_Y + prng.range(0.5, 1.0) : DECK_Y - 0.05, oo = deckEdge(sp) + prng.range(0.16, 0.34), lx = prng.range(-0.06, 0.06), pts = [];
        for (let j = 0; j <= 4; j++) { const y = lerp(tall, -0.4, j / 4); pts.push(at(sp + lx * y, oo, y)); }
        const sd0 = prng(), hw = prng.range(0.14, 0.2), col = prng.chance(0.3) ? pg.wood : pg.madder;
        marks.push({ pts, half: hw, side: wd, color: col, seed: sd0, dry: -0.45, margin: 0.15, order: 3 });
        marks.push({ pts, half: hw, side: wn, color: col, seed: sd0 + 0.31, dry: -0.45, margin: 0.15, order: 3 });
        const q0 = at(sp, oo + 0.25, 0.07), q1 = at(sp + 0.5, oo + prng.range(2.4, 5), 0.07);
        marks.push({ pts: [q0, [(q0[0] + q1[0]) / 2, 0.07, (q0[2] + q1[2]) / 2], q1], half: prng.range(0.2, 0.34), color: pg.ultra, seed: prng(), dry: 0.1, margin: 0.3, order: 0 });
      }
      // the shade under it: one stroke of ultramarine on the water, showing past the open edge
      const sp = []; for (let s = S0 + 6; s <= JL + 3; s += 9) sp.push(at(s, deckEdge(s) + 0.5 + 0.3 * Math.sin(s * 0.1), 0.07));
      sp.reverse();                                   // laid from the head back to the shore: loaded out there, dry and streaked by the landing
      marks.push({ pts: sp, half: 1.9, color: pg.ultra, seed: rng(), dry: 0.1, margin: 3, wave: [0.3, 90, 1, 0.9], order: 0 });
    }
    // runs of thinned paint from the lower edge of the wood, the tongue and the east shore, over the strand
    {
      const from = (line, every, col) => {
        for (let i = 1; i < line.length; i++) {
          const p = line[i]; if (p.h < 12 || !rng.chance(every * detail)) continue;
          const big = rng.chance(0.25);
          // a run hangs ON its foot line and ends as a drop: of its drawn scatter (two draws of 3 m either way) only the part
          // along the line is kept (the line's unit tangent is (-bz, bx)), so its top stands 0.4 m to the water side of the
          // foot, 1.2 m up; it comes down to the strand at that foot (the strand stroke of every shore lies at 0.06) and a
          // reach under it, from one run's width (0.3 m) for the shortest drawn length (1.5 m) to a tenth of the strand
          // stroke's greatest breadth (0.9 m of 2 x 4.6) for the longest (12 m)
          const along = rng.range(-3, 3) * -p.bz + rng.range(-3, 3) * p.bx, width = rng.range(0.2, 0.4), reach = 0.3 + 0.6 * ((big ? rng.range(6, 12) : rng.range(1.5, 5)) - 1.5) / 10.5;
          drips.push({ x: p.x - p.bx * 0.4 - p.bz * along, y: 1.2, z: p.z - p.bz * 0.4 + p.bx * along, width, length: (1.2 - 0.06) + reach, seed: rng(), at: rng.range(0, 0.5), color: col });
        }
      };
      from(woodLine, 0.95, pg.wood); from(woodLine, 0.7, pg.wood); from(tongueLine, 0.9, pg.wood); from(eastLine, 0.8, pg.wood);
      from(woodLine, 0.25, pg.madder);
      for (const l of isletLines) from(l, 0.9, pg.wood);
    }
    // (night pass) the exit's own echo: open arcs standing round the notch on the side we come from, one outside the
    // other as every echo is, pink and pale against the green-black crowns, so the way out is a large thing in the picture
    for (const [dr, hf, col, sweep] of [[3.2, 1.5, pg.gold, 4.2], [7.4, 0.9, pg.pale, 3.8], [12, 1.2, pg.pink, 3.5]]) {
      const a0 = (Math.PI - sweep) / 2 + frng.range(-0.22, 0.22), ph = frng.range(0, 6.28), fwd = 13 + dr * 0.25, pts = [], sides = [];
      for (let k = 0; k <= 44; k++) {
        const a = a0 + sweep * k / 44, rr = (PR + dr) * (1 + 0.05 * Math.sin(a * 2.3 + ph) + 0.02 * Math.sin(a * 5.3 + ph * 2)), c = Math.cos(a), sn = Math.sin(a);
        pts.push([PORTAL.x + SX * (TDIR[0] * c * rr + Math.SQRT1_2 * fwd), Math.max(0.3, PY + sn * rr), PORTAL.z + TDIR[1] * c * rr + Math.SQRT1_2 * fwd]);
        sides.push([SX * TDIR[0] * c, sn, TDIR[1] * c]);
      }
      marks.push({ pts, half: hf, side: (i) => sides[i], color: col, seed: frng(), dry: frng.range(-0.3, -0.05), margin: 1.5, wave: [0.3, 60, frng.range(0, 6.28), 0.7], order: 4 });
    }
    await ctx.yield();
    marks.sort((a, b) => a.order - b.order);
    {
      const m = new THREE.Mesh(await strokeGeometry(marks, ctx.yield), lineMat); m.renderOrder = 50; m.frustumCulled = false; scene.add(m);
      const l = new THREE.Mesh(await strokeGeometry(lines, ctx.yield), lineMat); l.renderOrder = 14; l.frustumCulled = false; scene.add(l);
    }
    const dripMat = runMaterial({ depthWrite: false });
    dripMat.uniforms.uRun.value = 1; dripMat.uniforms.uGrow.value.set(110, 420);
    {
      const dg = runGeometry(drips); dg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 600), 3000);
      const dm = new THREE.Mesh(dg, dripMat); dm.renderOrder = 52; dm.frustumCulled = false; scene.add(dm);
    }
    await ctx.yield();
    {
      const massGeo = await solids.geometry(ctx.yield);
      await ctx.yield();
      const mass = new THREE.Mesh(massGeo, massMat); mass.frustumCulled = false; scene.add(mass);
    }
    await ctx.yield();

    // ---- (4) the hero: the moon's reflection, a solid gold pillar with a round head. Not lifted, never narrows. ----
    const PW = 36, PHR = 22, PH = 250 + 2 * PHR - 4;      // (slim pass) the column: 36 wide, its head 44 across, 290 in all (local metres)
    const hero = await buildHero(ctx, { palette: PAL, detail, wind: windy, side: SX, billboard: true, shaftW: PW, headR: PHR, gaps: true });
    hero.object.position.copy(PILLAR); hero.object.scale.setScalar(pillarH(850) / PH); scene.add(hero.object);
    await ctx.yield();
    // From far off the reflection is one solid column of gold: a single loaded stroke the height of the shaft and one
    // for the head, laid behind the strokes, which thins away as we close (inside 260 m only the strokes are left:
    // "the pillar settles onto the water and comes apart into strokes"). Same shader, facing and breathing as the hero.
    const solidMat = strokeMaterial({ pillar: true, depthWrite: false, weave: 0.5 });
    const veilMat = strokeMaterial({ pillar: true, depthWrite: false, weave: 0.5 });
    // (outside-review pass) and under all of it the ground the gold was laid on: one loaded go of the pink underpaint, a
    // little narrower than the column, so that close to, where the gold streaks open, it is pink that shows between
    // them and not the sea behind: the column is one painted thing from every side
    const underMat = strokeMaterial({ pillar: true, depthWrite: false, weave: 0.4, lanes: 0.15 });
    {
      const hm = hero.materials.stroke.uniforms;
      solidMat.uniforms.uFace = hm.uFace; solidMat.uniforms.uBreath = hm.uBreath; solidMat.uniforms.uSwell = hm.uSwell;
      solidMat.uniforms.uDisc.value.copy(hm.uDisc.value);
      const hc = hero.anchors.headCenter, hr = hero.anchors.headRadius, shaft = [], head = [];
      // in two goes, below the slit and above it, so the way through stays open and the backing can stay on at any distance
      const foot = [];
      for (let k = 0; k <= 4; k++) foot.push([0.4 * Math.sin(k * 1.3), 21.5 - 26.5 * k / 4, -1.2]);
      for (let k = 0; k <= 26; k++) shaft.push([0.6 * Math.sin(k * 0.9), -4 + 260 * k / 26, -1.2]);
      for (let k = 0; k <= 8; k++) head.push([-hr - 4 + (2 * hr + 8) * k / 8, hc[1], -1.3]);
      const g = await strokeGeometry([
        { pts: shaft, half: PW * 0.46, side: [1, 0, 0], color: pg.gold, under: pg.pink, underAmt: 0.5, seed: 0.37, dry: -0.3, margin: 3, ext: [0, 0, 0] },
        { pts: head, half: hr, side: [0, 1, 0], color: pg.gold, seed: 0.71, dry: -0.6, margin: 3, ext: [hr - 0.6, 0, 0] },
      ]);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 170);
      const m = new THREE.Mesh(g, solidMat); m.renderOrder = 39; m.frustumCulled = false; hero.object.add(m);
      // the veil: one thin go of the same stroke across the slit. Far off the column is whole; inside 100 m the veil
      // thins away and the way through opens in front of us (and closes again behind)
      await ctx.yield();
      veilMat.uniforms.uFace = hm.uFace; veilMat.uniforms.uBreath = hm.uBreath; veilMat.uniforms.uSwell = hm.uSwell;
      {
        underMat.uniforms.uFace = hm.uFace; underMat.uniforms.uBreath = hm.uBreath; underMat.uniforms.uSwell = hm.uSwell;
        const uf = foot.map((p) => [p[0] * 1.4, p[1], -1.6]), us = shaft.map((p) => [-p[0], p[1], -1.6]);
        const ug = await strokeGeometry([
          { pts: us, half: 21.0, side: [1, 0, 0], color: pg.pink, seed: 0.61, dry: -0.6, margin: 3, ext: [0, 0, 0] },
        ]);
        ug.boundingSphere = g.boundingSphere;
        ug.dispose();      // (slim pass) no ground under the strokes: the far shore and the sky show in the dry gaps between them
      }
      const vp = []; for (let k = 0; k <= 4; k++) vp.push([0.5 * Math.sin(k * 1.1 + 2), 40 - 26 * k / 4, -1.25]);
      const vg = await strokeGeometry([{ pts: vp.map((p) => [-p[0], p[1], -1.45]), half: 19.2, side: [1, 0, 0], color: pg.pink, seed: 0.47, dry: -0.5, margin: 3, ext: [0, 0, 0] }, { pts: vp, half: 20.4, side: [1, 0, 0], color: pg.gold, under: pg.pink, underAmt: 0.4, seed: 0.83, dry: -0.45, margin: 3, ext: [0, 0, 0] }]);
      vg.boundingSphere = g.boundingSphere;
      vg.dispose();      // (gold pass) the veil is not hung: the backing is one go now
    }
    await ctx.yield();

    // ---- (lane pass, after the fourth outside review) THE REFLECTION LIES DOWN THE WATER, and the head has its echoes.
    // The column's light is paint, not glow. (a) From its foot a lane of level gold strokes runs over the sea toward the
    // eye, wherever the eye is (a reflection always lies between the light and whoever looks): each stroke stays where
    // it was laid on the water, the lane turns about the foot with us, and every stroke is as wide as the column LOOKS
    // from where we are, so column and lane are one gold thing of one width from the bottom edge to the round head. It
    // is not lifted with the sea, like the column itself. (b) Round the head, open echo arcs stand in the sky one outside
    // the other, as round every form here: gold innermost, pink, a thin ultramarine, pale, pink, a thin dry madder.
    const laneGroup = new THREE.Group(); laneGroup.position.copy(PILLAR); scene.add(laneGroup);
    const laneMat = strokeMaterial({ lane: true, depthWrite: false, near: 0.12, lanes: 0.7, weave: 0.7 });
    laneMat.uniforms.uLift = { value: 0 };
    // its strokes are built all one size, LANE_P apart along local z; the vertex shader sets each a fixed ratio nearer the
    // eye than the last and draws it in by as much (evenly spaced in the PICTURE, and one width in it); local z = LANE_Z
    // is the eye, and the group is scaled to the eye's distance each frame
    const LANE_W = 16.5, LANE_Z = 100, LANE_P = 8, LANE_R = 0.92;
    laneMat.uniforms.uLane.value.set(-Math.log(LANE_R) / LANE_P, LANE_Z);
    {
      const lr = ctx.rng.fork('white-night-lane'), list = [], nL = 66;
      for (let k = 0; k < nL; k++) {
        const hz = LANE_P * lr.range(0.4, 0.52), w = LANE_W * lr.range(0.86, 1.14), off = LANE_W * lr.range(-0.15, 0.15), dir = lr.chance(0.5) ? 1 : -1, tilt = lr.range(-0.035, 0.035), pts = [];
        const skip = k > 3 && lr.chance(0.06);                                // the hand misses one now and then
        for (let j = 0; j <= 8; j++) { const x = dir * w * (j / 4 - 1); pts.push([off + x, 0.13, (k + lr.range(-0.2, 0.2)) * LANE_P + tilt * x + 0.5 * Math.sin(j * 1.1 + k)]); }
        if (!skip) list.push({ pts, half: hz, side: [0, 0, 1], color: pg.gold, under: pg.pink, underAmt: 0.55, seed: lr(), dry: lr.range(-0.45, -0.05), margin: 2.4,
          wave: [0.8, w * lr.range(1.2, 2.2), lr.range(0, 6.28), lr.range(0.5, 1.2) * (lr.chance(0.5) ? 1 : -1)] });
      }
      await ctx.yield();
      const lg = await strokeGeometry(list, ctx.yield);
      lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 50), 60);
      const lane = new THREE.Mesh(lg, laneMat); lane.renderOrder = 37; lane.frustumCulled = false; laneGroup.add(lane);
    }
    await ctx.yield();
    const haloMat = strokeMaterial({ pillar: true, depthWrite: false, weave: 0.6, minPx: 1.7, lanes: 0.8 });
    {
      const hm = hero.materials.stroke.uniforms, hr0 = ctx.rng.fork('white-night-halo');
      haloMat.uniforms.uFace = hm.uFace; haloMat.uniforms.uBreath = hm.uBreath;
      const hc = hero.anchors.headCenter, hr = hero.anchors.headRadius, list = [];
      for (const [k, half, col, dry, goes] of [[1.6, 3.4, pg.gold, -0.15, 1], [2.5, 5.2, pg.pink, -0.1, 1], [3.6, 7.5, hour === 'one' ? pg.ultra : pg.pale, -0.3, 2],
        [4.9, 4.6, pg.pink, 0.1, 2], [6.4, 8.5, hour === 'one' ? pg.pink : pg.pale, 0.0, 2]]) {      // few, long and whole: each one go or two of the brush, never a row of dashes
        const R = hr * k, ph = hr0.range(0, 6.28), trim = hr0.range(0.05, 0.5) * (k > 3 ? 1 : 0.4), tl = hr0.chance(0.5), ox = hr0.range(-0.05, 0.05) * R, oy = hr0.range(-0.04, 0.05) * R,
          lo = -0.62 - 0.05 * k + (tl ? trim : 0), hi = Math.PI + 0.62 + 0.05 * k - (tl ? 0 : trim);      // open below, where the column stands
        let a = lo;
        for (let g = 0; g < goes; g++) {
          const a1 = g === goes - 1 ? hi : a + (hi - lo) / goes * hr0.range(0.8, 1.15), N = Math.max(8, Math.ceil(R * (a1 - a) / 7)), pts = [], sides = [], rev = hr0.chance(0.5);
          for (let j = 0; j <= N; j++) {
            const t = rev ? 1 - j / N : j / N, an = lerp(a, a1, t), rr = R * (1 + 0.05 * Math.sin(an * 2.3 + ph) + 0.02 * Math.sin(an * 5.7 + ph * 2)), c = Math.cos(an), sn = Math.sin(an);
            pts.push([hc[0] + ox + c * rr, hc[1] + oy + sn * rr * 0.94, -2.2 - 0.1 * k]); sides.push([c, sn, 0]);
          }
          list.push({ pts, half, side: (i) => sides[i], color: col, seed: hr0(), dry: dry + hr0.range(-0.08, 0.08), margin: Math.min(5, R * (a1 - a) * 0.06), ext: [0, 0, 0],
            wave: [0.5 + 0.12 * k, hr0.range(70, 150), hr0.range(0, 6.28), hr0.range(0.35, 0.8) * (hr0.chance(0.5) ? 1 : -1)] });
          a = a1 + hr0.range(0.07, 0.2);                                    // it never closes: the next go starts past a gap
          if (a > hi - 0.3) break;
        }
      }
      await ctx.yield();
      const hg = await strokeGeometry(list, ctx.yield);
      hg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 250, 0), 220);
      const halo = new THREE.Mesh(hg, haloMat); halo.renderOrder = 38; halo.frustumCulled = false; hero.object.add(halo);
    }
    await ctx.yield();

    // ---- the hand: laying strokes. Each is a ribbon built along its whole course; its head is keyed to u. ----
    const laying = [];
    const resample = (way, step) => {                 // world points, evenly spaced along a smooth curve through the waypoints
      const cv = new THREE.CatmullRomCurve3(way.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
      const n = Math.max(4, Math.ceil(cv.getLength() / step)), out = [], v = new THREE.Vector3();
      for (let i = 0; i <= n; i++) { cv.getPointAt(i / n, v); out.push([v.x, v.y, v.z]); }
      return out;
    };
    const lengthOf = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); return L; };
    const lay = async (o) => {
      await ctx.yield();
      const mat = strokeMaterial({ depthWrite: false, minPx: 1.6, near: 0.3 });
      const margin = o.margin ?? 2;
      const geo = await strokeGeometry([{ pts: o.pts, half: o.half, side: o.side, color: o.color, seed: rng(), dry: o.dry ?? 0.05, margin, wave: o.wave }]);
      const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = o.order ?? 20; mesh.frustumCulled = false; (o.parent || scene).add(mesh);
      const L = lengthOf(o.pts) - 2 * margin;
      mat.uniforms.uHead.value = -5;
      const l = { mat, uA: o.uA, uB: o.uB, L, margin };
      if (o.chase) {                                    // a stroke whose head follows the eye's place (headFor, below): it keeps its course and the metres along it
        l.chase = o.chase; l.pts = o.pts; l.arc = [0]; l.rise = []; let top = 0;
        for (let i = 1; i < o.pts.length; i++) l.arc.push(l.arc[i - 1] + Math.hypot(o.pts[i][0] - o.pts[i - 1][0], o.pts[i][1] - o.pts[i - 1][1], o.pts[i][2] - o.pts[i - 1][2]));
        // the eye's height over the water abreast of each point of the stroke (the highest so far: a lead never shortens,
        // so nothing laid is taken up again where the course comes down)
        for (let i = 0; i < o.pts.length; i++) { top = Math.max(top, path.nearestXZ(o.pts[i][0], o.pts[i][2]).y); l.rise.push(top); }
        // its start line is a place of the world: the stroke leaves when the eye is `g` metres past abreast of `from`
        l.chase = { v: o.chase.v, g: alongStroke(l, o.chase.from[0], o.chase.from[1]) + (o.chase.g || 0) };
      }
      laying.push(l);
      return L;
    };
    // (true pass 5) A LAYING STROKE THAT RUNS WITH THE EYE: one law of the eye's place for the four strokes that overtake us,
    // the same all along each one's course; none of it reads the clock, the flight's fraction or a place of the flight.
    // Where the eye is along a stroke is the stroke's own point nearest the eye on the map (metres from its first point;
    // short of the first point, metres short of it). (1) The stroke leaves its first point when the eye is `g` metres along
    // it (0: as the eye comes abreast of where it begins) and runs `v` times as fast as we do, so it comes up from behind
    // and passes under the eye. (2) It never runs further ahead than the picture holds it well: CHASE_C metres for each metre
    // the eye stands above the water there (a line of sight one in four under the level: 14 degrees, under half way from
    // the level to the bottom edge of this lens, which is 31 degrees down), and on from there by CHASE_MORE of every metre
    // we have flown since it left, so it is always the faster.
    const CHASE_C = 4, CHASE_MORE = 0.1;
    const alongStroke = (l, x, z) => {
      const Q = l.pts, A = l.arc, n = Q.length; let bi = 0, bd = 1e18;
      for (let i = 0; i < n; i++) { const dx = Q[i][0] - x, dz = Q[i][2] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
      let best = 1e18, s = A[bi];
      for (let i = Math.max(0, bi - 1); i <= Math.min(n - 2, bi); i++) {
        const ax = Q[i][0], az = Q[i][2], bx = Q[i + 1][0] - ax, bz = Q[i + 1][2] - az, ll = bx * bx + bz * bz || 1;
        const t = Math.min(1, ((x - ax) * bx + (z - az) * bz) / ll), tc = Math.max(0, t), ex = ax + bx * tc - x, ez = az + bz * tc - z, d = ex * ex + ez * ez;
        if (d < best) { best = d; s = A[i] + (A[i + 1] - A[i]) * (i === 0 ? t : tc); }
      }
      return s;
    };
    const headFor = (l, x, z) => {                      // metres of the stroke laid, for an eye at world (x, z)
      const c = l.chase, sE = alongStroke(l, x, z), A = l.arc, fast = c.v * (sE - c.g);
      let i = 0; while (i < A.length - 2 && A[i + 1] < sE) i++;
      const rise = lerp(l.rise[i], l.rise[i + 1], Math.min(1, Math.max(0, (sE - A[i]) / (A[i + 1] - A[i] || 1))));
      const hold = sE + CHASE_C * rise + CHASE_MORE * Math.max(0, sE - c.g);
      const k = 12, h = Math.min(1, Math.max(0, 0.5 + 0.5 * (hold - fast) / k));      // the lesser of the two, with a soft knee 12 m long: it eases to its lead
      return lerp(hold, fast, h) - k * h * (1 - h);
    };
    {
      // 1: overtakes under the port side at u 0.08 and rounds a boulder in centre frame, laying its echo
      const C = HERO_ROCK, R = C.r * 1.12 + 1.9, way = [[-9, C.z - 198], [-8.5, C.z - 148], [-8, C.z - 88], [-7.4, C.z - 33], [-6.4, C.z - 15]];
      for (let a = -75; a <= 75; a += 25) { const r = a * Math.PI / 180; way.push([C.x + Math.cos(r) * R, C.z + Math.sin(r) * R]); }
      way.push([-11, C.z + 11], [-15.5, C.z + 40], [-19, 130], [-26, 170], [-34, 210], [-39, 238], [JA[0] - 2.5, 258]);
      const pts = resample(way.map((p) => P(p[0], 0.1, p[1])), 2.2);
      // (true pass 5) it begins behind the entry and leaves as the eye comes into the world (its start line is the entry
      // itself), at 2.3 times our speed (the brief's 60 m/s on our 26); it passes under the port side among the first
      // shore stones and stays ahead among the boulders to the jetty's root
      await lay({ pts, half: 0.75, color: pg.madder, dry: 0.1, chase: { from: [path.start.x, path.start.z], v: 2.3 }, wave: [0.12, 60, 0, 0.6] });
      // 2: the wood's echo being laid along its contour ahead of us, from the first frame
      const p2 = [];
      for (const p of woodLine) if (p.z > 40 && p.z < 760) p2.push([p.x + p.bx * 4.6, p.h - 1.6 + 0.6 * Math.sin(p.z * 0.045), p.z + p.bz * 4.6]);
      await lay({ pts: p2, half: 0.55, side: [0, 1, 0], color: pg.madder, uA: -0.035, uB: 0.3, wave: [0.3, 300, 1, 0.5] });
      // 3 to 5 (night pass): three race up the new course from the jetty's head, overtake us close under the eye off the
      // wood and past the pillar's west side, and run in to its foot. Each is laid along the course, a few metres off it.
      const alongCourse = (u0, u1, off, step = 0.004) => {       // brief-frame [x, z] points beside the course (off: metres to starboard)
        const out = [], pv = new THREE.Vector3(), tv = new THREE.Vector3();
        for (let u = u0; u <= u1 + 1e-6; u += step) {
          path.pointAt(u, pv); path.tangentAt(u, tv); const tl = Math.hypot(tv.x, tv.z) || 1, o = typeof off === 'function' ? off(u) : off;
          out.push([SX * pv.x + (tv.z / tl) * o, pv.z - SX * (tv.x / tl) * o]);
        }
        return out;
      };
      // (true pass 5) each in its own lane beside the course, from 10 m beyond the jetty's head for `run` metres of the
      // course and on to its end at the foot (where the ribbons have always lain). Each leaves its first point as the eye
      // comes abreast of it, 1.66 times as fast as we are (the brief's 70 m/s on our 42), and runs in to the foot ahead of
      // us by the one law of headFor. The pale one on the wood's side goes first: its lane begins on the water beyond the
      // rail, a third of the jetty's length short of the others; then the pink one; the other pale one leaves when the eye
      // is a quarter of the jetty's length past its first point, comes up from behind and passes beneath.
      const uJH = path.nearestXZ(SX * JH[0], JH[1]).u + 10 / path.length;
      const three = [
        { off: 9.5, run: 340, end: [[-52, PZ + 4], [-30, PZ + 1]], c: pg.pink, half: 1.5 },
        { off: -8.5, back: JL / 3, run: 460, end: [], c: hour === 'one' ? pg.ultra : pg.pale, half: 1.2 },
        { off: 15, run: 310, end: [[-50, PZ - 24], [-26, PZ - 20]], c: hour === 'one' ? pg.ultra : pg.pale, half: 1.7, g: JL / 4 },
      ];
      for (const t of three) {
        const way3 = [...alongCourse(uJH - (t.back || 0) / path.length, uJH + t.run / path.length, t.off), ...t.end];
        const pts3 = resample(way3.map((p) => P(p[0], 0.11, p[1])), 5);
        await lay({ pts: pts3, half: t.half, color: t.c, chase: { from: [pts3[0][0], pts3[0][2]], g: t.g || 0, v: 1.66 }, margin: 3, wave: [0.5, 120, rng.range(0, 6.28), 0.8] });
      }
      // 6: a sky stroke laid across the pale bands ahead as we climb out of the pillar
      const p6 = []; for (let k = 0; k <= 26; k++) { const a = SX * (-0.6 + 1.3 * k / 26); p6.push([Math.sin(a) * (RS - 1.5), (400 + 60 * Math.sin(k / 26 * 3.1)) / SKS, Math.cos(a) * (RS - 1.5)]); }
      await lay({ pts: p6, half: 52 / SKS, side: [0, 1, 0], color: pg.pink, dry: -0.1, uA: 0.585, uB: 0.69, margin: 2.5, order: 5, parent: skyGroup, wave: [0.5, 75, 0, 0.6] });
      // 7 and 8: two dive ahead of us round the same curve, and one runs on through the notch
      // (polish pass) the first of them is GOLD: it leaves the far foot of the pillar as we come up to it, so beyond the
      // break-through the gold goes on ahead of us up the sea wall, round the bay and back through the notch to the pillar
      for (const t of [{ c: pg.gold, half: 2.6, thru: true, uA: 0.6, per: 2000 }, { c: pg.madder, half: 1.5, thru: false, uA: 0.62, per: 2400 }]) {
        const way7 = t.thru ? [[5, PZ + 34], [9, PZ + 70], [18, PZ + 105], ...alongCourse(0.7, 0.992, (u) => 7 * (1 - sm(0.88, 0.96, u)), 0.01), [100, 781], [84, 766], [62, 764], [44, PZ - 24]]
          : [...alongCourse(0.655, 0.9, -15, 0.01), [238, 872], [247, 842]];
        const pts7 = resample(way7.map((p) => P(p[0], 0.11, p[1])), 7);
        await lay({ pts: pts7, half: t.half, color: t.c, uA: t.uA, uB: t.uA + lengthOf(pts7) / t.per, dry: t.thru ? -0.25 : 0.05, margin: 3, wave: [0.4, 110, rng.range(0, 6.28), 0.8] });
      }
      // 9: the last one runs along the tongue's contour, down into the notch and round the portal: the exit being outlined
      const p9 = [], s9 = [];
      for (let t = NOTCH_T + 126; t >= NOTCH_T + NW + 1; t -= 3) {
        const k = sm(40, NW, t - NOTCH_T), h = 43.5 * roundEnd(t - NOTCH_T - NW, 24);
        const n = lerp(tongueHalf(t) - 5, 0, k), y = lerp(h + 4.2, PY + 2, sm(0, 1, k));
        p9.push(P(TIP[0] + TDIR[0] * t + Math.SQRT1_2 * n, y, TIP[1] + TDIR[1] * t + Math.SQRT1_2 * n)); s9.push([0, 1, 0]);
      }
      for (let a = 8; a <= 318; a += 9) {
        const r = a * Math.PI / 180, R9 = PR + 2.3 + 0.4 * Math.sin(r * 3);
        p9.push([PORTAL.x + SX * TDIR[0] * Math.cos(r) * R9, PY + Math.sin(r) * R9, PORTAL.z + TDIR[1] * Math.cos(r) * R9]);
        s9.push([SX * TDIR[0] * Math.cos(r), Math.sin(r), TDIR[1] * Math.cos(r)]);
      }
      await lay({ pts: p9, half: 0.8, side: (i) => s9[i], color: pg.madder, dry: -0.3, uA: 0.8, uB: 0.93, margin: 1, order: 55, wave: [0.15, 80, 0, 0.6] });
    }
    await ctx.yield();

    // ---- the rare event, the unfinished canvas: a dozen more laying strokes paint the sea in ahead of us ----
    if (rare) {
      for (let i = 0; i < 12; i++) {
        const z = 236 + i * 92 + rng.range(-14, 14);
        const x0 = Math.max(shoreX(z) + 12, -210), x1 = Math.min(z > 600 && z < 890 ? 868 - z : eastX(z) - 12, 230);
        if (x1 - x0 < 60) continue;
        const N = Math.ceil((x1 - x0) / 20), bow = rng.range(-6, 6), dir = i % 2 === 0, pts = [];
        for (let k = 0; k <= N; k++) { const t = dir ? k / N : 1 - k / N; pts.push(P(lerp(x0, x1, t), 0.09, z + bow * 4 * t * (1 - t))); }
        const uA = Math.min(0.6, Math.max(0, (z - 400) / 1410)) + 0.01 * (i % 3);
        await lay({ pts, half: rng.range(4.5, 8), color: hour === 'one' ? pg.pale : [pg.ultra, pg.pale, pg.pink][i % 3], dry: -0.05, uA, uB: uA + 0.075, margin: 5, order: 19,
          wave: [0.8, 150, rng.range(0, 6.28), 0.8] });
      }
    }
    await ctx.yield();

    // every instance keeps its own clock, lift and buffer height (two visits of this world can be on screen at once)
    const U = { uLift: { value: 1 }, uTime: { value: 0 }, uViewH: { value: STYLE.uViewH.value } };
    scene.traverse((o) => {
      const m = o.material;
      if (m && m.uniforms) for (const k of ['uLift', 'uTime', 'uViewH']) if (m.uniforms[k] === STYLE[k]) m.uniforms[k] = U[k];
    });
    if (rare) { skyMat.uniforms.uHead.value = 0; skyMat.uniforms.uStagger.value = 1170; }

    const cw = new THREE.Vector3();
    // the gaze from the break-through to the notch (polish pass): as we climb out behind the pillar the eye swings round
    // to starboard, the way we are about to turn, until it rests on the pillar, and holds it through the diving turn
    const gp = new THREE.Vector3(), gt = new THREE.Vector3(), gAt = new THREE.Vector3();
    // (night pass) from the wood on, the eye leans to starboard and holds the pillar while the course goes round it, comes
    // right round to look back down the fjord from above, and travels on to the notch for the dive
    // (slim pass) one gaze for the whole flight. Yaw: the course's own heading until the jetty's head, then the eye goes to
    // the pillar and holds it all the way round (a little to one side of the middle, a different side in each quarter of
    // the arc), then travels on to the notch. Pitch: never so low that the round head leaves the top of the frame; round
    // the pillar the eye rests half way up it.
    const offK = knots([[0.4, 0.3], [0.52, 0.24], [0.61, -0.04], [0.70, -0.1], [0.79, 0.3], [0.86, 0.3], [1, 0]]);      // where the pillar sits from the middle of the view, radians (+ to starboard)
    const gazeAt = (time, u) => {
      path.pointAt(u, gp); path.tangentAt(u, gt);
      const hb = Math.atan2(SX * gt.x, gt.z), dxp = SX * (PILLAR.x - gp.x), dzp = PILLAR.z - gp.z, dP = Math.max(20, Math.hypot(dxp, dzp));
      let df = Math.atan2(dxp, dzp) - hb; df -= Math.round(df / 6.28319) * 6.28319; if (df < -1.75) df += 6.28319;
      const dxq = SX * (PORTAL.x - gp.x), dzq = PORTAL.z - gp.z, dQ = Math.max(20, Math.hypot(dxq, dzq));
      let dq = Math.atan2(dxq, dzq) - hb; dq -= Math.round(dq / 6.28319) * 6.28319; if (dq < -1.75) dq += 6.28319;
      const w = sm(0.3, 0.5, u), q = sm(0.805, 0.88, u);
      const H = pillarH(dP) * pillarSide(gp.x, gp.z), top =Math.atan2(H - gp.y, dP), foot = Math.atan2(-gp.y, dP);
      const el0 = Math.max(Math.atan2(gt.y, Math.hypot(gt.x, gt.z) || 1) * 0.4, top - 0.45);
      const el = lerp(lerp(el0, Math.max(0.5 * (top + foot) + 0.02, top - 0.45), sm(0.36, 0.5, u)), Math.atan2(PY - gp.y, dQ) + 0.05, q);
      // (true pass 5) no glance at the wood's wall (it turned the eye into the wall and pushed the pillar to the edge of the
      // picture). In its place the eye rests on the pillar while the course slants in to the jetty: a hold keyed to the
      // eye's place along the jetty's own line (js: metres from its root, negative short of it), coming on between one and a
      // half jetty lengths and one jetty length short of the root and let go over the last third of a length, where the
      // course's own line takes it up (the jetty is aimed at the pillar's foot)
      const js = (SX * gp.x - JA[0]) * jd[0] + (gp.z - JA[1]) * jd[1], hold = sm(-1.5 * JL, -JL, js) * (1 - sm(-JL / 3, 0, js));
      const g = hb + 0.36 * sm(0.035, 0.075, u) * (1 - sm(0.085, 0.125, u)) + hold * (1 - w) * df + lerp(w * (df - offK(Math.max(0.4, u))), dq, q), D = 200, ce = Math.cos(el);      // (a glance at the heap of boulders to starboard as the first stroke overtakes)
      return gAt.set(gp.x + SX * Math.sin(g) * ce * D, gp.y + Math.sin(el) * D, gp.z + Math.cos(g) * ce * D);
    };
    const reachMats = [bandMat, bandMatC, massMat, rockMat];
    const pace = (u) => 0.8 + 0.45 * sm(0.32, 0.38, u) - 0.4 * sm(0.47, 0.53, u) + 0.3 * sm(0.8, 0.85, u) - 0.2 * sm(0.88, 0.93, u);      // lingers in the shallows, on the jetty and round the pillar

    return {
      scene, path, duration: 41, pace,
      camera: { fov: 62, near: 0.3, far: 9000, nearThrough: 0.3, bank: 0.05 },      // nearly level in the turn: the pillar stands upright in the picture
      pois: [
        { at: gazeAt, from: 0, to: 0.985, fade: 0.04, weight: 0.93 },
      ],
      portal: { shape: 'circle', radius: PR, color: '#E9C85A', glow: 0.45, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        ctx.renderer.getDrawingBufferSize(buf);
        cw.setFromMatrixPosition(camera.matrixWorld);
        dome.position.copy(cw); ground.position.set(cw.x, 0, cw.z); skyGroup.position.set(cw.x, 0, cw.z);
        hero.setProgress(u); hero.update(dt, time, camera);
        U.uTime.value = time; U.uViewH.value = Math.max(1, buf.y);
        const dPil = Math.hypot(cw.x - PILLAR.x, cw.z - PILLAR.z);
        // the backing stays on at every distance: close to, the level strokes lie over one streaked upright stroke, so the
        // column is one painted thing and its strokes never read as bars floating apart
        // (night pass) the backing is for far off, where the column is one loaded go of gold; inside 400 m it thins away and
        // the tower is its own stacked strokes over a dry scrub of the pink underpaint, with the fjord showing between
        solidMat.uniforms.uOpacity.value = 0.9 * sm(430, 760, dPil); veilMat.uniforms.uOpacity.value = solidMat.uniforms.uOpacity.value;
        underMat.uniforms.uOpacity.value = 0.94;
        // The reflection ignores optics. Far off it is larger than the tower we come to: from the entry it is gold from mid
        // frame to its round head above the far hills; at the jetty's head it is the 360 m tower. (true pass 5) It stands
        // at that height from the first frame: nothing grows at the entry. From the north and the bay side it is drawn
        // down, so its round head stays in the picture beside the notch: by the eye's place (pillarSide), not by u.
        const hs = pillarH(dPil) / PH * pillarSide(cw.x, cw.z);
        hero.object.scale.setScalar(hs);
        // the lane turns about the foot to lie toward the eye, as wide as the column
        laneGroup.rotation.y = Math.atan2(cw.x - PILLAR.x, cw.z - PILLAR.z); laneGroup.scale.set(hs * PW * 0.6 / LANE_W, 1, Math.max(20, dPil) / LANE_Z);
        massMat.uniforms.uEdgeAmt.value = 1 - 0.85 * sm(0.5, 0.6, u) + 0.85 * sm(0.86, 0.93, u);
        massMat.uniforms.uLanes.value = 1 - 0.4 * sm(0.55, 0.65, u) + 0.4 * sm(0.86, 0.93, u);   // seen from above a mass is one flat shape
        // the sea wall eases down in two goes: by half while the gold is out of frame in the turn (so from above the
        // portal, which the engine draws unlifted, sits at the foot of its notch), and to nothing for the last approach
        U.uLift.value = 1 - sm(0.82, 0.93, u);
        for (const l of laying) {
          if (l.chase) { const h = headFor(l, cw.x, cw.z) - l.margin; l.mat.uniforms.uHead.value = h <= 0 ? -5 : h >= l.L + 8 ? 1e9 : h; continue; }
          const t = (u - l.uA) / (l.uB - l.uA);
          l.mat.uniforms.uHead.value = t <= 0 ? -5 : t >= 1 ? 1e9 : t * (l.L + 8);
        }
        if (rare) {
          const reach = REACH0 + 2600 * sm(0.58, 0.8, u);
          for (const m of reachMats) m.uniforms.uReach.value = reach;
          skyMat.uniforms.uHead.value = 35 + 1460 * Math.min(1, u / 0.62);
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
