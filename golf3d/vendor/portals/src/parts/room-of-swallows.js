// THE KISS OF THE SWALLOWS, INSIDE A PAINTED WIND: hero set piece of "room-of-swallows".
//
// The three painted walls of the upstairs room at Thera, twenty-five times life size, as one continuous
// buon fresco strip 285 m long and 75 m high (south wall, west wall, north wall), and everything painted
// on it that moves: undulating red / yellow / blue crags with a loaded-brush outline that swells and runs
// dry, 600 lilies in clumps of three, 40 swallows that peel off the plaster in pairs, leave a pale ghost,
// meet beak to beak in the air and lie back down, and the gust that crosses the whole painting every 8 s.
// The seventh pair leads the camera up round the room and kisses in front of the window.
// The hero is ONLY the painted walls and the painted creatures. Floor, ceiling, window, door, furniture, lizard,
// dust and the view outside belong to the world.
// ROUND TWO: the painting no longer stops. (1) Low rocks with lilies of their own close every gap the first layout
// left on the three walls. (2) The east wall is painted too: its plaster face with the niche, window and door cut out
// is a second mesh of the same shader with its own canvases (strip s 285..370, north to south): pinnacles in the
// piers and the corner, low rocks under the niche and the sill, short stiff lilies. (3) Seventy-two swallows: to the
// seventh pair, the six taught pairs and the thirteen colony pairs are added four loose flocks of eight, which rest
// together, leave the plaster bird after bird, fly strung out ahead of the eye as a rising echelon and lie back down
// in their ghosts (FLOCKS in makeFlock: u windows, ways, and the fourth flock's string). (4) The route's east leg runs 30 m from the window wall.
// (5) The lighter step inside the sun shape is warm (#FFF2C6 plaster), with a soft edge: sunlight, not a pane.
// (6) On the unfinished wall the colour waits at the red crag and then floods north 17 m ahead of the eye through the
// close pass (a pure function of u, 0.17-0.335); lilies beyond the front are red outline only.
// ROUND THREE: the fourth flock flies one long string round the west half of the room (FLOCKS, trail); the kiss is
// carried along ahead of the eye through its hold; no bird but the seventh pair comes nearer than 15 m.
// ROUND FOUR: eighty-six swallows (a fifth flock of fourteen rests over the door and wheels as one ring under the
// joists, u 0.345-0.55). The first two taught pairs now kiss close in front of the eye (holds about u 0.14-0.18 over
// the loom corner and 0.23-0.27 over the store jars; `at` in the taught table of makeFlock). Nobody goes home any more: THE LEAVING (FIN) takes
// every bird off the plaster for good from u 0.623 (ghosts stay), gathers them into one ribbon 172 m long that crosses
// the north-west of the room, sweeps east over the bed, turns under the south wall, climbs the west wall, hangs over
// the kiss (0.795-0.818) and pours out through the window (0.82-0.97); the seventh pair follows last and meets a
// second time in the opening (0.922-0.952). Lilies are painted up both stone jambs (strip s 410.., 460..); the ghost
// keeps a faint drawn line; the flood front is a crisp brush edge. On the rare visit the wheel is five tiers (TIERS).
//
// LOCAL SPACE  origin at the centre of the room floor, +Y up, and the BRIEF'S axes: +X east (the window
//              wall, the open side: the "front" of this piece is +X, not +Z, because the brief fixes the
//              compass), +Z south. local = brief - (50, 0, 42.5). Room: x -50..50, z -42.5..42.5, y 0..75.
//              Painted faces: south wall z = +42.5, west wall x = -50, north wall z = -42.5, seen from
//              inside only (the backs are culled, so the set-piece viewer looks in from outside).
//              Strip coordinate s (metres along the painting, the way the gust runs): 0..100 south wall
//              from its east end (x = 50 - s), 100..185 west wall (z = 42.5 - (s - 100)), 185..285 north
//              wall (x = s - 235). hero.stripToRoom(s, y, off, out) converts.
// SIZE         true extent 100 x 85 x 75 m (hero.size). radius / height / center are VIEWER hints only:
//              the viewer orbits the kiss point at 20 to 31 m. Do not use them to place anything.
// COST         about 140k to 170k triangles at detail 1 (lilies about 700 x 132 at density 1; swallows and ghosts
//              72 x 2 x ~330; walls 6 + 62), 5 draw calls (walls, east wall, ghosts, lilies, swallows), 6 canvas
//              textures (2 x 4096x512, 1 x 1024x128, and 2 x 1280x512, 1 x 320x128 for the east wall), no lights.
//              Build about 300 to 450 ms here, with a yield after every second crag.
// LIGHTING     None wanted. Every material is an unlit ShaderMaterial writing the brief's exact pigments
//              (linear), with scene fog honoured if the world sets any (the brief wants none). Shown as
//              meant only under post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1,
//              vignette: 0, grain: 0 } }. The one lighting effect is the SUN SHAPE: a point is sunlit when
//              the ray from it toward uSunDir passes the window's inner rectangle (and the outer one, if
//              the world tightens it); sunlit plaster goes #EFE8DA -> #FFFBF0 and each pigment to its one
//              lighter step. In spring the sun stands 47 degrees round (not the brief's 35) so that the shape
//              lies ahead of the eye on the north wall, x 5..21, with the seventh pair's nest at its east edge. hero.uniforms holds the shared uniform objects (uSunDir, uWinIn, uWinOut,
//              uGustT, uPlaster, uPlasterSun, uPig[5], uPigSun[5]) and hero.glsl the two shared chunks
//              (hero.glsl.sun: float sunAt(vec3 heroLocalPos); hero.glsl.gust: vec2 gustAt(float s);
//              hero.glsl.crack: float crackLines(vec2 metres, float pixelSizeInMetres), needs hero.glsl.hash):
//              put the same uniform objects and chunks into the floor, furniture and dust shaders.
//              hero.sunShapeAt(out) is the centre of the shape now, hero.pairAt(u, out) the seventh pair's
//              midpoint at progress u (both for the world's gaze), hero.sun0 the sun's start { az, el }.
//
// OPTS         palette  7 hex strings in brief order (plaster, sunlit plaster, red ochre, yellow ochre,
//                       Egyptian blue, black, haze)
//              look     'spring' (sun shape low on the north wall, lilies) | 'noon' (steep sun: no shape
//                       on the walls, papyrus heads, mostly blue rocks) | 'unfinished' (the west wall is a
//                       red sketch with string lines until the first gust after u 0.09 floods it with
//                       colour). Default: 'noon' when ctx.vary.hour is 'day', otherwise seeded.
//              cast     'red' | 'yellow' | 'blue': the pigment that leads the rocks (default seeded;
//                       the crag on the entry axis is always red with a blue cleft)
//              lily     'red' | 'white' (bare plaster outlined in red) | 'papyrus' (default by look / seed)
//              rare     true: the tremor. u 0.445..0.578 every swallow leaves the plaster, wheels over
//                       the bed in tiers of one tilted ring (RING, TIERS) and lies back down, and the hairline crack in the north wall
//                       runs 14 m further (default ctx.vary.rare)
//              path     a makePath() object in hero-local coordinates: the camera route. The seventh pair
//                       spirals by its nest until u 0.42, flies 28 m ahead of the eye from 0.45, kisses 12.5 m in
//                       front of path.pointAt(0.80) and is carried on at the eye's speed through the hold (so it stays
//                       15 m ahead), then parts and sails 20 m ahead either side of the window
//                       (0.83-0.89), then meets again in the window opening (0.922-0.952) and flies out last.
//                       Default: makePath(anchors.flyThrough). hero.setPath(path) does the same later
//                       (call it in build(), it only refills arrays).
//              density  multiplier for lily clumps (default ctx.vary.density)
//              demo     true (default): until setProgress() is first called, u runs by itself on a loop
//                       0.65..0.96 that has the kiss at time 12 s, so the viewer shows the moment.
//
// PROGRESS     hero.setProgress(u) every frame with the world's path u. Swallows, buds, the flood of the
//              unfinished wall and the tremor are keyed to u; the gust, flapping, shivering and the creep
//              of the sun shape run on the clock. hero.kiss (0..1) is how close the seventh pair is to
//              the kiss; hero.air is the number of birds off the wall.
//
// ANCHORS      (hero-local)
//   flyThrough   ordered [x,y,z] points of the brief's route: one low lap 13 m from the walls (30 m from the window
//                wall), the higher half lap, the half turn over the bed and 88 m straight out of the window. 413 m.
//                Nothing of the hero is solid: the only things near the line are birds; every bird but the seventh
//                pair slides out of a 9 m ball round the eye. buildFlyThrough(heightKeys) is exported so the world
//                can lift the route (it does, at the window) and hand the result back through opts.path.
//   portalSeat   { position (64, 40, -0.5), normal (-1, 0, 0), radius 8 }: outer face of the window (it fills the
//                18 m opening, so the portal is a fifth of the frame wide by the time the pair has parted).
//   window       { center (50, 40, -0.5), width 18 (z), height 24, sill 28, depth 15 } for the world's frame.
//   kiss         { position, u0 0.795, u1 0.818, facing }: where the seventh pair hangs beak to beak.
//   heroNest     the two ghosts on the north wall (x 19.6 and 28.4, y 22) the seventh pair leaves at u 0.36 and
//                returns to at 0.955-0.97.
//   pairs        [{ u0, u1, meet (Vector3), uMeet }] the six taught kisses, for pois (first: over the crag).
//   crag         top of the red crag on the entry axis (-50, 33.5, 29.5); entry (48, 7, 29.5) looks at it.
//   sunShape     centre of the sun shape on the north wall at build time.
//   viewpoints   { entry, closePass, sun, window, kissEye }: camera positions for the brief's must-work frames.
//   pace         suggested pace keys [[u, pace], ...] from the brief.
//
// STYLE (so the world can match it). Flat fresco: every painted mark is one constant colour from the six
// pigments; the only tone change is the single lighter step inside the sun shape (pigment x 1.35, 4 % toward
// #FFFBF0: brighter, not chalkier). Rocks: flat fields from a coverage texture thresholded with fwidth (butted edges, a 0.25 m band
// thinned 22 % toward plaster just inside each outline) and a distance-field outline 0.15 to 0.6 m wide whose
// width swells and whose ends break into dry-brush speckle. Plaster: hairline cracks, day-joins and snapped
// string lines as 1.5 px lines 8 to 17 % darker than the plaster (cracks: stretches of a cellular field's edges). Lilies and birds are flat geometry
// 0.1 to 0.4 m off the wall that bends within its own plane. Real things should be two flat steps (lit side /
// shade side = pigment and pigment x 0.72, hard edge) with a hard cast shadow, never gradients.
import * as THREE from 'three';
import { makePath, makeRng, smoothstep, clamp, lerp } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EFE8DA', '#FFFBF0', '#A63A24', '#D9A441', '#3A6EA5', '#1E1B1A', '#A9C9DF'];
const TAU = Math.PI * 2;
const RX = 50, RZ = 42.5, RH = 75;          // half extents and height of the room
const SLEN = 285;                            // length of the painted strip on the south, west and north walls
const SE0 = 285, ELEN = 85, SALL = SE0 + ELEN;   // the east wall carries the strip on: s 285..370, north to south
const TEX_WE = 1280;                         // the east wall's own painting canvases (same texels per metre)
const TEX_W = 4096, TEX_H = 512;             // painting canvases
const PPM = TEX_W / SLEN;                    // texels per metre (14.37)
const YTOP = TEX_H / PPM;                    // strip height covered by the canvases (35.6 m)
const NLEV = 10;                             // distance levels in the outline field (one texel each)
const GUST_SPEED = 24, GUST_GAP = 192;       // m/s, metres between fronts (8 s)
const WIN = { x: RX, xo: RX + 15, z: -0.5, y: 40, hw: 9, hh: 12 };
const PIG = { plaster: 0, red: 1, yellow: 2, blue: 3, black: 4 };
// The spring sun stands further round than the brief's 35 degrees so that its window shape lies on the north wall
// AHEAD of the eye as the route comes east (centre near x 11..19), with the seventh pair's nest at its east edge.
const SPRING_SUN = { az: 47, el: 24.5 };

// strip (s, y) -> room position, `off` metres proud of the plaster
function stripToRoom(s, y, off, out) {
  if (s < 100) return out.set(RX - s, y, RZ - off);
  if (s < 185) return out.set(-RX + off, y, RZ - (s - 100));
  if (s < SE0) return out.set(-RX + (s - 185), y, -RZ + off);
  return out.set(RX - off, y, -RZ + (s - SE0));
}
// unit vectors of the wall at s: along (+s) and normal (into the room)
function wallFrame(s, along, normal) {
  if (s < 100) { along.set(-1, 0, 0); normal.set(0, 0, -1); }
  else if (s < 185) { along.set(0, 0, -1); normal.set(1, 0, 0); }
  else if (s < SE0) { along.set(1, 0, 0); normal.set(0, 0, 1); }
  else { along.set(0, 0, 1); normal.set(-1, 0, 0); }
}
// the gust: x = bow strength (-0.3..1), y = metres behind the front
function gustAt(s, t) {
  let ph = (GUST_SPEED * t - s) % GUST_GAP; if (ph < 0) ph += GUST_GAP;
  const bump = smoothstep(0, 7, ph) * (1 - smoothstep(9, 22, ph));
  const ring = Math.exp(-ph / 26) * Math.sin(ph * 0.42) * smoothstep(16, 30, ph) * 0.45;
  return [bump - ring, ph];
}

const GLSL_STRIP = /* glsl */`
vec3 stripToRoom(vec2 q, float off){
  if (q.x < 100.0) return vec3(50.0 - q.x, q.y, 42.5 - off);
  if (q.x < 185.0) return vec3(-50.0 + off, q.y, 42.5 - (q.x - 100.0));
  if (q.x < 285.0) return vec3(-50.0 + (q.x - 185.0), q.y, -42.5 + off);
  if (q.x < 400.0) return vec3(50.0 - off, q.y, -42.5 + (q.x - 285.0));
  if (q.x < 440.0) return vec3(50.0 + clamp(q.x - 410.0, 0.0, 14.7), q.y, -9.5 + off);
  return vec3(50.0 + clamp(q.x - 460.0, 0.0, 14.7), q.y, 8.5 - off);
}
`;
const GLSL_GUST = /* glsl */`
uniform float uGustT;
vec2 gustAt(float s){
  float ph = mod(${GUST_SPEED.toFixed(1)} * uGustT - s, ${GUST_GAP.toFixed(1)});
  float bump = smoothstep(0.0, 7.0, ph) * (1.0 - smoothstep(9.0, 22.0, ph));
  float ring = exp(-ph / 26.0) * sin(ph * 0.42) * smoothstep(16.0, 30.0, ph) * 0.45;
  return vec2(bump - ring, ph);
}
`;
// sunAt(p): 1 where the hero-local point p sees the sun through the window, with a hard (0.12 m) edge
const GLSL_SUN = /* glsl */`
uniform vec3 uSunDir;
uniform vec4 uWinIn;   // x plane, z centre, y centre, unused
uniform vec4 uWinOut;
uniform vec4 uWinHalf; // inner half width (z), inner half height, outer half width, outer half height
float sunAt(vec3 p){
  float dx = max(uSunDir.x, 0.02);
  float t1 = (uWinIn.x - p.x) / dx;
  float t2 = (uWinOut.x - p.x) / dx;
  vec3 a = p + uSunDir * t1;
  vec3 b = p + uSunDir * t2;
  float e = 0.3;
  float ia = (1.0 - smoothstep(uWinHalf.x - e, uWinHalf.x + e, abs(a.z - uWinIn.y))) * (1.0 - smoothstep(uWinHalf.y - e, uWinHalf.y + e, abs(a.y - uWinIn.z)));
  float ib = (1.0 - smoothstep(uWinHalf.z - e, uWinHalf.z + e, abs(b.z - uWinOut.y))) * (1.0 - smoothstep(uWinHalf.w - e, uWinHalf.w + e, abs(b.y - uWinOut.z)));
  return ia * ib * step(0.01, t1) * step(0.02, uSunDir.x);
}
`;
const GLSL_PIG = /* glsl */`
uniform vec3 uPig[5];
uniform vec3 uPigSun[5];
vec3 pigment(float idx, float sun){
  vec3 a = uPig[0], b = uPigSun[0];
  if (idx > 3.5) { a = uPig[4]; b = uPigSun[4]; }
  else if (idx > 2.5) { a = uPig[3]; b = uPigSun[3]; }
  else if (idx > 1.5) { a = uPig[2]; b = uPigSun[2]; }
  else if (idx > 0.5) { a = uPig[1]; b = uPigSun[1]; }
  return mix(a, b, sun);
}
`;
const GLSL_HASH = /* glsl */`
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

// Hairline cracks in lime plaster: stretches of the edges of a cellular field, so they run straight, turn sharply and
// fork where three cells meet. px = size of a pixel in metres (take it before calling; no derivatives in here).
const GLSL_CRACK = /* glsl */`
float vorEdge(vec2 x){
  vec2 n = floor(x), f = fract(x);
  vec2 mg = vec2(0.0), mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + vec2(hash21(n + g + 17.0), hash21(n + g + 43.0)) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 r = g + vec2(hash21(n + g + 17.0), hash21(n + g + 43.0)) - f;
    vec2 dr = r - mr;
    float l2 = dot(dr, dr);
    if (l2 > 1e-5) md = min(md, dot(0.5 * (mr + r), dr) / sqrt(l2));
  }
  return md;
}
float crackLines(vec2 q, float px){
  vec2 w = q + 0.8 * (vec2(vnoise(q * 0.4 + 3.0), vnoise(q * 0.4 + 19.0)) - 0.5);
  float d = vorEdge(w / 17.0) * 17.0;
  float he = max(0.04, 0.8 * px);
  float l = (1.0 - smoothstep(he - 0.6 * px, he + 0.6 * px, d)) * min(1.0, 0.04 / he + 0.4);
  // only some stretches of the network have opened: a crack starts, forks at a corner and stops
  float open = smoothstep(0.52, 0.57, vnoise(q * 0.085 + 31.7)) * smoothstep(0.4, 0.5, vnoise(q * 0.021 + 7.0));
  return l * open;
}
`;

// ---------------------------------------------------------------- the painting: crags, drawn into canvases
// One crag lobe: a closed undulating silhouette standing on the floor. Returns [[s, y], ...].
function lobePoints(c, n = 46) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = Math.pow(Math.max(0, Math.sin(Math.PI * t)), c.pw);
    const und = 1 + c.a1 * Math.sin(TAU * c.f1 * t + c.p1) + c.a2 * Math.sin(TAU * c.f2 * t + c.p2);
    const y = c.h * e * und;
    const x = c.c + c.w * (t - 0.5) * (1 + c.bulge * e) + c.lean * y + c.wob * Math.sin(TAU * c.f3 * t + c.p3) * e;
    pts.push([x, y]);
  }
  return pts;
}
function scaledPoints(pts, cx, kx, ky, dx) {
  return pts.map(([x, y]) => [cx + (x - cx) * kx + dx * (y > 0 ? 1 : 0), y * ky]);
}
// smooth path through the midpoints of a polyline (metres); closed shapes go below the floor line
function tracePoly(path, pts, i0, i1, closed) {
  if (closed) {
    path.moveTo(pts[0][0], -3);
    path.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) path.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    const l = pts[pts.length - 1];
    path.lineTo(l[0], l[1]); path.lineTo(l[0], -3); path.closePath();
    return;
  }
  const d = i1 >= i0 ? 1 : -1;
  path.moveTo(pts[i0][0], pts[i0][1]);
  for (let i = i0 + d; i !== i1; i += d) path.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + d][0]) / 2, (pts[i][1] + pts[i + d][1]) / 2);
  path.lineTo(pts[i1][0], pts[i1][1]);
}
function slicePts(pts, i0, i1) {
  const out = [], d = i1 >= i0 ? 1 : -1;
  for (let i = i0; i !== i1 + d; i += d) out.push(pts[i]);
  return out;
}

// Lay out the crags for the whole strip. Pure data, no drawing.
async function layoutCrags(ctx, rng0, V) {
  let rng = rng0;
  const lobes = [], roots = [];
  const others = { 1: [2, 3], 2: [1, 3], 3: [1, 2] };
  const pickPig = (not) => {
    for (let k = 0; k < 8; k++) {
      const r = rng();
      const p = r < 0.52 ? V.lead : others[V.lead][r < 0.76 ? 0 : 1];
      if (p !== not) return p;
    }
    return others[not][0];
  };
  const mkShape = (c, w, h) => ({
    c, w, h, pw: rng.range(0.42, 0.62), bulge: rng.range(0.05, 0.3), lean: rng.range(-0.1, 0.1),
    a1: rng.range(0.06, 0.15), f1: rng.range(1.4, 2.6), p1: rng.range(0, TAU),
    a2: rng.range(0.03, 0.07), f2: rng.range(3.5, 6.5), p2: rng.range(0, TAU),
    wob: w * rng.range(0.02, 0.05), f3: rng.range(2, 4), p3: rng.range(0, TAU),
  });
  const addLobe = (shape, pig, o = {}) => {
    const pts = lobePoints(shape);
    let top = 0; for (const p of pts) top = Math.max(top, p[1]);
    if (top > 33.6) { const k = 33.6 / top; for (const p of pts) p[1] *= k; }
    const n = pts.length - 1;
    const lobe = { pts, pig, fills: [], strokes: [], s0: shape.c - shape.w * 0.7, s1: shape.c + shape.w * 0.7, east: !!o.east };
    // silhouette: two brush strokes that start at the feet and run dry where they meet near the top
    const jt = Math.round(n * rng.range(0.42, 0.6));
    const lineRed = o.redLine ? 1 : 0;
    // two in five are drawn the other way: loaded at the summit, pulled down each flank and dry by the foot
    const down = !o.cleft && (lobes.length % 5 === 1 || lobes.length % 5 === 3);
    const a0 = Math.min(n, jt + 3), b0 = Math.max(0, jt - 1);
    lobe.strokes.push({ pts: down ? slicePts(pts, a0, 0) : slicePts(pts, 0, a0), red: lineRed, w: rng.range(0.75, 1), dry: 1 });
    lobe.strokes.push({ pts: down ? slicePts(pts, b0, n) : slicePts(pts, n, b0), red: lineRed, w: rng.range(0.7, 1), dry: 1 });
    // inner band of a second pigment following the contour, and sometimes a bare or third core
    if (o.band !== false && shape.h > 9) {
      const kx = rng.range(0.56, 0.72), ky = rng.range(0.6, 0.78), dx = rng.range(-0.06, 0.06) * shape.w;
      const band = scaledPoints(pts, shape.c, kx, ky, dx);
      const bp = o.bandPig ?? pickPig(pig);
      lobe.fills.push({ pts: band, pig: bp });
      const a = Math.round(n * rng.range(0.06, 0.2)), b = Math.round(n * rng.range(0.7, 0.92));
      const fwd = rng.chance(0.5);
      lobe.strokes.push({ pts: fwd ? slicePts(band, a, b) : slicePts(band, b, a), red: (bp === 1 || pig === 1) ? 0 : (rng.chance(0.7) ? 1 : 0), w: rng.range(0.3, 0.6), dry: 1 });
      if (o.core !== false && rng.chance(0.45) && shape.h > 15) {
        const core = scaledPoints(band, shape.c + dx, rng.range(0.45, 0.6), rng.range(0.5, 0.66), 0);
        lobe.fills.push({ pts: core, pig: rng.chance(0.5) ? 0 : pickPig(bp) });
      }
      // a wavy vein up the middle
      if (rng.chance(0.55)) {
        const vx = shape.c + dx + rng.range(-0.12, 0.12) * shape.w, vh = shape.h * ky * rng.range(0.45, 0.7), vp = rng.range(0, TAU);
        const v = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12; v.push([vx + Math.sin(t * 5 + vp) * 0.9 + shape.lean * vh * t, 1.5 + vh * t]); }
        lobe.strokes.push({ pts: v, red: bp === 1 ? 0 : 1, w: rng.range(0.2, 0.4), dry: 1 });
      }
    }
    if (o.cleft) {
      // the blue cleft of the red crag: a tall spindle, black-edged on both sides
      const cx = shape.c + shape.lean * 20 + 0.8, L = [], R = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14, y = 9 + 19.5 * t, hw = 2.1 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * t)), 0.8), bend = Math.sin(t * 3.4) * 1.1;
        L.push([cx + bend - hw, y]); R.push([cx + bend + hw * 0.9, y]);
      }
      const poly = L.concat(R.slice().reverse());
      lobe.fills.length = 0; lobe.strokes.length = 2;
      lobe.fills.push({ pts: poly, pig: 3, open: true });
      lobe.strokes.push({ pts: L, red: 0, w: 0.75, dry: 1 });
      lobe.strokes.push({ pts: R.slice().reverse(), red: 0, w: 0.6, dry: 1 });
    }
    lobes.push(lobe);
    // lily roots along the upper silhouette
    if (o.roots !== false) {
      const m = o.rootsN ?? Math.round(shape.w * 0.7) + 3;
      for (let k = 0; k < m; k++) {
        const t = o.rootT ? rng.range(o.rootT[0], o.rootT[1]) : rng.range(0.05, 0.95), i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
        const x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
        const ok = o.east ? x > SE0 + 0.8 && x < SALL - 1 && (!o.cap || o.cap - y > 4.2) : x > 2.5 && x < SLEN - 2.5;
        if (y > Math.min(shape.h * 0.5, 9) && ok) {
          const r = { s: x, y: y - 0.4, lean: (t - 0.5) * 2.2 + rng.range(-0.2, 0.2), top: shape.h, lobe: lobes.length - 1 };
          if (o.east) { r.east = true; r.lean *= 0.25; r.cap = Math.min(o.cap ?? 46, r.y + 7.5); }
          roots.push(r);
        }
      }
    }
    return lobe;
  };
  const cluster = (c, w, H, o = {}) => {
    const back = o.back ?? rng.chance(0.62);
    const all = o.all || {};
    let last = 0;
    if (back) { last = o.backPig ?? pickPig(0); addLobe(mkShape(c + rng.range(-0.18, 0.18) * w, w * rng.range(0.5, 0.66), H), last, { ...all, ...(o.backOpts || {}) }); }
    const mp = o.mainPig ?? pickPig(last);
    addLobe(mkShape(c + (o.mainShift ?? 0), w * rng.range(0.82, 1), back ? H * rng.range(0.58, 0.8) : H), mp, { ...all });
    const nf = o.fronts ?? rng.int(1, 2);
    let side = rng.sign();
    for (let k = 0; k < nf; k++) {
      addLobe(mkShape(c + side * w * rng.range(0.24, 0.4), w * rng.range(0.3, 0.46), H * rng.range(0.24, 0.42)), pickPig(mp), { core: false, ...all });
      side = -side;
    }
  };
  // forced: the red crag with the blue cleft on the entry axis, and a low clump under the hero pair's nest
  const forced = [[99, 127], [227, 270]];
  let s = 2 + rng.range(0, 5);
  while (s < 281) {
    const w = rng.range(15, 30);
    const hit = forced.find((f) => s < f[1] && s + w > f[0]);
    if (hit) {
      if (hit[0] - s > 9) cluster((s + hit[0]) / 2 - 0.5, hit[0] - s - 2, rng.range(17, 24));
      s = hit[1] + rng.range(2, 5); continue;
    }
    if (s + w > 284) break;
    const close = s > 124 && s < 186;   // the close pass: tall crags, short gaps
    cluster(s + w / 2, w, close ? rng.range(21, 27) : rng.range(18, 31.5));
    s += w + (close ? rng.range(2.5, 6) : rng.chance(0.6) ? rng.range(2.5, 8) : rng.range(10, 19));
    await ctx.yield();   // (a yield draws nothing from the random stream: the layout is the same with or without it)
  }
  // the crag on the entry axis: a lower mass behind, the tall red crag with its blue cleft in front, two feet
  addLobe(mkShape(114.5, 27, 20.5), V.lead === 1 ? 2 : V.lead);
  const crag = mkShape(113, 19, 33.5); crag.lean = 0.03; crag.pw = 0.46; crag.bulge = 0.22;
  addLobe(crag, 1, { cleft: true, band: false, rootsN: 5, rootT: [0.36, 0.64] });
  addLobe(mkShape(102.5, 8.5, 8.5), 3, { core: false, roots: false });
  addLobe(mkShape(124.5, 9.5, 7.5), V.lead === 1 ? 2 : 3, { core: false, roots: false });
  await ctx.yield();
  cluster(238, 20, rng.range(19, 23));                          // the crags the sun shape lies on
  cluster(257, 21, 12.5, { back: false, fronts: 1 });         // the low clump under the seventh pair's nest
  // a lily must spring from rock that shows: drop roots hidden by a lobe painted later
  const inside = (pts, x, y) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  };
  await ctx.yield();
  const baseLobes = lobes.length, baseRoots = roots.length;
  const shown = roots.filter((r) => { for (let k = r.lobe + 1; k < baseLobes; k++) if (inside(lobes[k].pts, r.s, r.y - 0.6)) return false; return true; });

  await ctx.yield();
  // ---- second pass (its own random stream, so the crags above stay as they were): the painting runs on without a break.
  // (1) every stretch of the three walls that the first pass left bare gets a run of low rocks with lilies of their own
  rng = rng0.fork('fill');
  const cov = new Float32Array(SLEN + 2);
  for (const l of lobes) for (let i = 0; i < l.pts.length - 1; i++) {
    const a = l.pts[i], b = l.pts[i + 1], y = Math.max(a[1], b[1]);
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0]))), x1 = Math.min(SLEN, Math.ceil(Math.max(a[0], b[0])));
    for (let x = x0; x <= x1; x++) if (y > cov[x]) cov[x] = y;
  }
  let run = -1, lastPig = 0;
  for (let x = 1; x <= SLEN; x++) {
    const open = x < SLEN - 1 && cov[x] < 7.5;
    if (open && run < 0) run = x;
    if (!open && run >= 0) {
      let a = run - 2.5;
      const b = Math.min(x + 2.5, SLEN - 0.5);
      run = -1;
      if (b - a < 8) continue;
      while (b - a >= 6.5) {
        const w = Math.min(b - a, rng.range(11, 17));
        lastPig = pickPig(lastPig);
        addLobe(mkShape(a + w / 2, w, rng.range(9, 15.5)), lastPig, { core: false });
        if (rng.chance(0.65)) addLobe(mkShape(a + w * rng.range(0.25, 0.75), w * rng.range(0.34, 0.5), rng.range(4, 7)), pickPig(lastPig), { core: false, roots: false });
        a += w * 0.88;
      }
      await ctx.yield();
    }
  }
  // (2) the east wall, round its three openings (strip s = 285 + metres from the north-east corner; niche 5.5..20.5 above
  // y 20, window 33..51 above y 28 with its stone surround 27..57 from y 24, door 64..80): two pinnacles in the piers,
  // a third in the corner, and low rocks under the niche and under the sill. Lilies there are short and stiff so that
  // none can lean out over an opening.
  const pin = (c, w, h, pig, o) => { const sh = mkShape(SE0 + c, w, h); sh.lean = 0; sh.wob = Math.min(sh.wob, 0.15); sh.bulge = Math.min(sh.bulge, 0.1); sh.pw = 0.5; return addLobe(sh, pig, { east: true, core: false, ...o }); };
  const pA = pickPig(0), pB = pickPig(pA);
  pin(2.5, 4.3, 25, pA, { rootsN: 3, rootT: [0.38, 0.62], cap: 36 });
  pin(24.3, 6.0, 28, pB, { rootsN: 4, rootT: [0.36, 0.64], cap: 40 });
  pin(59.3, 5.0, 27, pickPig(pB), { rootsN: 4, rootT: [0.36, 0.64], cap: 39 });
  await ctx.yield();
  cluster(SE0 + 13, 20, 14, { all: { east: true, cap: 19.2 }, fronts: 2 });
  cluster(SE0 + 42, 24, 16.5, { all: { east: true, cap: 23.6 }, fronts: 2 });
  addLobe(mkShape(SE0 + 83.2, 3.2, 11), pickPig(0), { east: true, core: false, band: false, roots: false });
  await ctx.yield();
  const extraRoots = roots.slice(baseRoots).filter((r) => { for (let k = r.lobe + 1; k < lobes.length; k++) if (inside(lobes[k].pts, r.s, r.y - 0.6)) return false; return true; });
  return { lobes, roots: shown, extraRoots };
}

// Draw the crags into three canvases: A = pigment coverage (r red, g yellow, b blue), B = proximity to the
// nearest outline (NLEV one-texel steps, so it is a linear distance field), C (quarter size) = stroke width,
// dryness and line pigment. Later lobes overpaint earlier ones in all three.
async function paintStrip(ctx, lobes, maxAniso, W = TEX_W, s0 = 0) {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cA = mk(W, TEX_H), cB = mk(W, TEX_H), cC = mk(W / 4, TEX_H / 4);
  const gA = cA.getContext('2d'), gB = cB.getContext('2d'), gC = cC.getContext('2d');
  gA.fillStyle = '#000'; gA.fillRect(0, 0, W, TEX_H);
  gB.fillStyle = '#000'; gB.fillRect(0, 0, W, TEX_H);
  gC.fillStyle = 'rgb(128,0,0)'; gC.fillRect(0, 0, W / 4, TEX_H / 4);
  gA.setTransform(PPM, 0, 0, -PPM, -s0 * PPM, TEX_H);
  gB.setTransform(PPM, 0, 0, -PPM, -s0 * PPM, TEX_H);
  gC.setTransform(PPM / 4, 0, 0, -PPM / 4, -s0 * PPM / 4, TEX_H / 4);
  gB.lineCap = 'round'; gB.lineJoin = 'round'; gC.lineCap = 'round'; gC.lineJoin = 'round';
  const COL = ['#000', '#f00', '#0f0', '#00f'];
  await ctx.yield();
  for (let li = 0; li < lobes.length; li++) {
    const lobe = lobes[li];
    const sil = new Path2D(); tracePoly(sil, lobe.pts, 0, 0, true);
    gA.fillStyle = COL[lobe.pig]; gA.fill(sil);
    for (const f of lobe.fills) {
      const p = new Path2D();
      if (f.open) { p.moveTo(f.pts[0][0], f.pts[0][1]); for (let i = 1; i < f.pts.length; i++) p.lineTo(f.pts[i][0], f.pts[i][1]); p.closePath(); }
      else tracePoly(p, f.pts, 0, 0, true);
      gA.fillStyle = COL[f.pig]; gA.fill(p);
    }
    gB.globalCompositeOperation = 'source-over'; gB.fillStyle = '#000'; gB.fill(sil);
    const sp = new Path2D();
    for (const st of lobe.strokes) tracePoly(sp, st.pts, 0, st.pts.length - 1, false);
    gB.globalCompositeOperation = 'lighten';
    for (let k = NLEV; k >= 1; k--) {
      const v = Math.round(255 * (1 - (k - 0.5) / NLEV));
      gB.lineWidth = (2 * k) / PPM; gB.strokeStyle = `rgb(${v},${v},${v})`; gB.stroke(sp);
    }
    // width, dryness and pigment of each stroke, a short piece at a time
    for (const st of lobe.strokes) {
      const P = st.pts, N = P.length;
      gC.lineWidth = 1.5;
      let total = 0, run = 0;
      for (let i = 0; i < N - 1; i++) total += Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
      for (let i = 0; i < N - 1; i++) {
        const seg = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
        const q = (run + 0.5 * seg) / Math.max(total, 1e-3);   // by arc length: the brush runs dry over metres, not points
        run += seg;
        let curv = 0;
        if (i > 0) {
          const ax = P[i][0] - P[i - 1][0], ay = P[i][1] - P[i - 1][1], bx = P[i + 1][0] - P[i][0], by = P[i + 1][1] - P[i][1];
          const dot = (ax * bx + ay * by) / Math.max(1e-6, Math.hypot(ax, ay) * Math.hypot(bx, by));
          curv = Math.min(1, Math.acos(clamp(dot, -1, 1)) / 0.3);
        }
        const wn = clamp(st.w * lerp(0.4, 1, smoothstep(0, 0.14, q)) * lerp(1, 0.5, smoothstep(0.55, 1, q)) * (0.8 + 0.5 * curv) + 0.2 * curv, 0, 1);
        const dry = st.dry * smoothstep(0.74, 0.98, q);
        gC.strokeStyle = `rgb(${Math.round(wn * 255)},${Math.round(dry * 255)},${st.red ? 255 : 0})`;
        gC.beginPath(); gC.moveTo(P[i][0], P[i][1]); gC.lineTo(P[i + 1][0], P[i + 1][1]); gC.stroke();
      }
    }
    if ((li & 1) === 1) await ctx.yield();
  }
  const tex = (c, mips) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = mips; t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = mips ? maxAniso : 1;
    return t;
  };
  return { tFill: tex(cA, true), tLine: tex(cB, true), tAux: tex(cC, false) };
}

// ---------------------------------------------------------------- the plaster and everything painted in it
const WALL_VERT = /* glsl */`
attribute vec2 aSY;
varying vec2 vSY; varying vec3 vP;
#include <common>
#include <fog_pars_vertex>
void main(){
  vSY = aSY; vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const WALL_FRAG = /* glsl */`
uniform sampler2D tFill, tLine, tAux;
uniform float uTime, uFloodS, uUnfinished, uCrackEnd, uBands;
uniform vec2 uStrip;   // where this mesh's canvases start along the strip, and their length in metres
uniform vec3 uPlaster, uPlasterSun;
varying vec2 vSY; varying vec3 vP;
#include <common>
#include <fog_pars_fragment>
${GLSL_GUST}
${GLSL_SUN}
${GLSL_PIG}
${GLSL_HASH}
${GLSL_CRACK}
float hair(float c, float w){ return 1.0 - smoothstep(w * 0.5, w, abs(c) / max(fwidth(c), 1e-5)); }
void main(){
  vec2 q = vSY;
  float px = max(length(vec2(dFdx(q.x), dFdy(q.x))), length(vec2(dFdx(q.y), dFdy(q.y))));
  px = clamp(px, 1e-4, 4.0);
  float sun = sunAt(vP);
  vec2 g = gustAt(q.x);

  // ---- plaster: burnish, hairline cracks, day-joins, snapped string lines
  vec3 base = mix(uPlaster, uPlasterSun, sun);
  float bn = vnoise(q * 0.06) + vnoise(q * 0.19 + 11.0) - 1.0;
  base *= 1.0 + 0.016 * bn;
  float crack = crackLines(q, px);
  // the one long crack in the north wall (the tremor lengthens it): straight runs and sharp turns
  float yc = 52.0 + 9.0 * (abs(fract(q.x * 0.043) - 0.5) - 0.25) + 3.4 * (abs(fract(q.x * 0.19 + 0.3) - 0.5) - 0.25) + 0.9 * (abs(fract(q.x * 0.77) - 0.5) - 0.25);
  float big = hair(q.y - yc, 2.2) * smoothstep(196.0, 199.0, q.x) * (1.0 - smoothstep(uCrackEnd - 2.5, uCrackEnd, q.x));
  crack = max(crack, big);
  float j1 = q.y - (38.6 + 2.4 * (vnoise(vec2(q.x * 0.05, 3.0)) - 0.5));
  float j2 = q.y - (57.5 + 2.0 * (vnoise(vec2(q.x * 0.04, 13.0)) - 0.5));
  float cv = (fract(q.x / 47.5 + 0.21) - 0.5) * 47.5 + 2.0 * (vnoise(vec2(q.y * 0.06, 9.0)) - 0.5);
  float joins = max(max(hair(j1, 1.6), hair(j2, 1.6)), hair(cv, 1.6) * step(abs(cv), 3.0));
  float snap = smoothstep(0.22, 0.3, vnoise(vec2(q.x * 0.11, 5.0)));
  float strings = max(hair(q.y - 45.7, 1.5) * snap, hair(q.y - 68.9, 1.5));
  float snap2 = smoothstep(0.3, 0.36, vnoise(vec2(q.x * 0.13, 21.0)));
  float sy2 = q.y - 29.2 - 0.05 * sin(q.x * 0.9);
  strings = max(strings, hair(sy2, 1.9) * snap2 * (0.75 + 0.25 * step(0.5, vnoise(vec2(q.x * 2.3, 2.0)))));
  // where the taut string was snapped it left a spatter of beads either side of the line
  vec2 bq = vec2(q.x / 0.7, sy2 / 0.7); vec2 bi = floor(bq);
  float bh = hash21(bi + 91.0);
  float bead = (1.0 - smoothstep(0.16, 0.16 + px / 0.7, length(fract(bq) - 0.5 - 0.3 * (vec2(bh, hash21(bi + 5.0)) - 0.5))));
  strings = max(strings, 0.8 * bead * step(0.86, bh) * step(abs(sy2), 1.05) * snap2 * (1.0 - smoothstep(0.1, 0.3, px)));
  vec3 col = base * (1.0 - 0.17 * crack) * (1.0 - 0.07 * joins) * (1.0 - 0.2 * strings);

  // ---- the unfinished wall: a red sketch until the flood front has passed
  float zone = uUnfinished * smoothstep(99.0, 101.0, q.x) * (1.0 - smoothstep(184.0, 186.0, q.x));
  float flooded = smoothstep(0.0, max(0.12, 1.5 * px), uFloodS - q.x + 10.0 * (vnoise(q * 0.2) - 0.5) + 2.2 * (vnoise(q * 0.9 + 7.0) - 0.5) + 0.5 * (vnoise(q * 4.0 + 3.0) - 0.5));
  float sketch = zone * (1.0 - flooded);
  float sv = (fract(q.x / 14.2 + 0.4) - 0.5) * 14.2;
  float guide = max(max(hair(q.y - 11.8, 1.6), hair(q.y - 23.6, 1.6)), max(hair(q.y - 34.4, 1.6), hair(sv, 1.6) * step(abs(sv), 2.0) * step(q.y, 46.0)));
  col = mix(col, pigment(1.0, sun), guide * zone * mix(0.16, 0.8, 1.0 - flooded));

  // ---- the crags: flat fields butted edge to edge, then the loaded-brush outline
  float pin = smoothstep(0.0, 7.0, q.y);
  vec2 rp = q + g.x * pin * vec2(0.6 * sin(0.33 * q.y + 0.35 * g.y), 0.24 * sin(0.4 * q.x + 0.5 * g.y));
  vec2 uv = vec2((rp.x - uStrip.x) / uStrip.y, rp.y / ${YTOP.toFixed(4)});
  float inTex = 1.0 - step(${(YTOP - 0.2).toFixed(3)}, rp.y);
  vec3 cov = texture2D(tFill, uv).rgb * inTex;
  float prox = texture2D(tLine, uv).r * inTex;
  vec3 aux = texture2D(tAux, uv).rgb;
  float d = (1.0 - prox) * ${(NLEV / PPM).toFixed(4)};
  float m = max(cov.r, max(cov.g, cov.b));
  float idx = cov.r >= m ? 1.0 : (cov.g >= m ? 2.0 : 3.0);
  float aa = clamp(px * ${(PPM * 0.6).toFixed(3)}, 0.03, 0.45);
  float fillA = smoothstep(0.5 - aa, 0.5 + aa, m) * (1.0 - sketch);
  float hw = mix(0.075, 0.3, aux.r) * (1.0 - 0.3 * aux.g) * mix(1.0, 0.75, sketch);
  float hwe = max(hw, 0.8 * px);
  float line = 1.0 - smoothstep(hwe - 0.7 * px, hwe + 0.7 * px, d);
  float speck = mix(0.5 * vnoise(rp * vec2(6.5, 1.7)) + 0.3 * vnoise(rp * vec2(1.9, 7.5) + 5.0) + 0.2 * vnoise(rp * 12.0 + 3.0), 0.5, smoothstep(0.1, 0.4, px));
  line *= smoothstep(aux.g * 1.15 - 0.14, aux.g * 1.15, speck + 0.12) * min(1.0, hw / hwe + 0.35);
  col = mix(col, pigment(idx, sun), fillA);
  float lineRed = max(step(0.5, aux.b), step(0.5, sketch));
  col = mix(col, pigment(mix(4.0, 1.0, lineRed), sun), line);

  // ---- the bands under the ceiling
  float e = px * 0.8;
  float bRed1 = smoothstep(69.6 - e, 69.6 + e, q.y) * (1.0 - smoothstep(71.6 - e, 71.6 + e, q.y));
  float bBlk = smoothstep(72.35 - e, 72.35 + e, q.y) * (1.0 - smoothstep(73.0 - e, 73.0 + e, q.y));
  float bRed2 = smoothstep(73.8 - e, 73.8 + e, q.y) * step(2.5, uBands);
  col = mix(col, pigment(1.0, sun), max(bRed1, bRed2));
  col = mix(col, pigment(4.0, sun), bBlk);

  // ---- flecks of red pigment blown along with the front
  vec2 fq = vec2(q.x - ${(GUST_SPEED * 0.8).toFixed(1)} * uGustT, q.y) / 1.9;
  vec2 fi = floor(fq);
  float fh = hash21(fi);
  vec2 fc = fi + 0.5 + 0.5 * (vec2(hash21(fi + 3.1), hash21(fi + 7.7)) - 0.5);
  fc.y += 0.12 * sin(uTime * 3.0 + fh * 40.0);
  float fr = 0.07 + 0.09 * hash21(fi + 1.7);
  float fre = max(fr, 0.9 * px);
  float fl = (1.0 - smoothstep(fre - 0.6 * px, fre + 0.6 * px, length(fq - fc) * 1.9)) * step(0.9, fh) * (fr * fr) / (fre * fre);
  col = mix(col, pigment(1.0, sun), fl * smoothstep(0.12, 0.45, g.x) * step(q.y, 68.0));

  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;
function buildWallGeometry() {
  // three quads, front faces looking into the room; aSY = strip coordinates
  const P = [], SY = [], I = [];
  const v = new THREE.Vector3();
  const quad = (s0, s1) => {
    const b = P.length / 3;
    for (const [s, y] of [[s0, 0], [s1, 0], [s1, RH], [s0, RH]]) {
      stripToRoom(s === s1 ? s1 - 1e-6 : s, y, 0, v); P.push(Math.round(v.x * 1e3) / 1e3, v.y, Math.round(v.z * 1e3) / 1e3); SY.push(s, y);
    }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  quad(0, 100); quad(100, 185); quad(185, 285);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aSY', new THREE.Float32BufferAttribute(SY, 2));
  g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, RH / 2, 0), 80);
  return g;
}

// The east wall: the same plaster and paint round the cupboard niche, the window and the door (the world models what is
// IN those openings; the numbers are the world's NICHE, WIN and DOOR). Front faces look west, into the room.
export const EAST_OPENINGS = [{ z0: -37, z1: -22, y0: 20, y1: 42 }, { z0: -9.5, z1: 8.5, y0: 28, y1: 52 }, { z0: 21.5, z1: 37.5, y0: -1, y1: 50 }];
function buildEastGeometry() {
  const P = [], SY = [], I = [];
  const zs = [-RZ, -37, -22, -9.5, 8.5, 21.5, 37.5, RZ], ys = [0, 20, 28, 42, 50, 52, RH];
  const hole = (z, y) => EAST_OPENINGS.some((r) => z > r.z0 && z < r.z1 && y > r.y0 && y < r.y1);
  for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    if (hole((zs[i] + zs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)) continue;
    const b = P.length / 3;
    for (const [z, y] of [[zs[i], ys[j]], [zs[i + 1], ys[j]], [zs[i + 1], ys[j + 1]], [zs[i], ys[j + 1]]]) { P.push(RX, y, z); SY.push(SE0 + z + RZ, y); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aSY', new THREE.Float32BufferAttribute(SY, 2));
  g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, RH / 2, 0), 80);
  return g;
}

// ---------------------------------------------------------------- lilies (and papyrus): flat instanced marks
// One plant: a stem ribbon (position = side, t, part 0), stamens (part 1) and three petals (part 2) given in
// head space in metres, each with a closed-bud twin (aBud). aAcr = (across -1..1, half width in metres).
function buildLilyGeometry(kind) {
  const P = [], B = [], A = [], I = [];
  const SEG = 12;
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    P.push(-1, t, 0, 1, t, 0); B.push(0, 0, 0, 0); A.push(-1, 0.1, 1, 0.1);
    if (i < SEG) { const b = i * 2; I.push(b, b + 1, b + 3, b, b + 3, b + 2); }
  }
  // a ribbon in head space from two centre lines (open and bud) with their half widths
  const ribbon = (n, open, bud, part) => {
    const b0 = P.length / 3;
    const co = [], cb = [];
    let po = [0, 0], pb = [0, 0];
    for (let i = 0; i <= n; i++) {
      const q = i / n, o = open(q), u = bud(q);
      co.push([po[0], po[1], o.a, o.w]); cb.push([pb[0], pb[1], u.a, u.w]);
      po = [po[0] + Math.sin(o.a) * o.len / n, po[1] + Math.cos(o.a) * o.len / n];
      pb = [pb[0] + Math.sin(u.a) * u.len / n, pb[1] + Math.cos(u.a) * u.len / n];
    }
    for (let i = 0; i <= n; i++) {
      for (const sd of [-1, 1]) {
        const [x, y, a, w] = co[i], [bx, by, ba, bw] = cb[i];
        P.push(x + Math.cos(a) * sd * w, y - Math.sin(a) * sd * w, part);
        B.push(bx + Math.cos(ba) * sd * bw, by - Math.sin(ba) * sd * bw);
        A.push(sd, w);
      }
      if (i < n) { const b = b0 + i * 2; I.push(b, b + 1, b + 3, b, b + 3, b + 2); }
    }
    return [co[n], cb[n]];
  };
  const dot = (c, cbud, r, part) => {
    const b0 = P.length / 3;
    P.push(c[0], c[1], part); B.push(cbud[0], cbud[1]); A.push(0, r);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      P.push(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, part); B.push(cbud[0] + Math.cos(a) * r * 0.4, cbud[1] + Math.sin(a) * r * 0.4); A.push(1, r);
    }
    for (let k = 0; k < 6; k++) I.push(b0, b0 + 1 + k, b0 + 1 + ((k + 1) % 6));
  };
  const pap = kind === 'papyrus';
  // stamens first (they lie under the petals)
  const sa = pap ? [-0.66, -0.22, 0.22, 0.66] : [-0.62, -0.2, 0.2, 0.62];
  for (const a of sa) {
    const [eo, eb] = ribbon(3,
      (q) => ({ a: a * (1 + 0.5 * q), len: pap ? 3.15 : 1.9, w: 0.07 - 0.02 * q }),
      (q) => ({ a: a * 0.08, len: 1.5, w: 0.03 }), 1);
    dot(eo, eb, pap ? 0.2 : 0.17, 1);
  }
  for (const sg of [-1, 1, 0]) {
    const PART = sg === 0 ? 2.8 : sg < 0 ? 2.0 : 2.4;   // each petal on its own paint layer
    if (pap) {
      ribbon(8,
        (q) => ({ a: sg * 0.52, len: 2.45, w: 0.1 + 0.8 * q - (q > 0.9 ? (q - 0.9) * 3.5 : 0) }),
        (q) => ({ a: sg * 0.06, len: 2.0, w: 0.08 + 0.2 * Math.sin(Math.PI * Math.min(1, 0.05 + 0.95 * q)) }), PART);
    } else if (sg === 0) {
      ribbon(10,
        (q) => ({ a: 0.14 * Math.sin(q * 3.0), len: 2.35, w: 0.4 * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * q)), 0.75) }),
        (q) => ({ a: 0.03 * Math.sin(q * 3.0), len: 2.3, w: 0.21 * Math.pow(Math.sin(Math.PI * (0.05 + 0.95 * q)), 0.8) }), PART);
    } else {
      ribbon(10,
        (q) => ({ a: sg * (0.42 + 2.3 * Math.pow(q, 1.25)), len: 2.75, w: 0.43 * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * q)), 0.75) * (1 - 0.15 * q) }),
        (q) => ({ a: sg * 0.06 * q, len: 2.2, w: 0.2 * Math.pow(Math.sin(Math.PI * (0.05 + 0.95 * q)), 0.8) }), PART);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aBud', new THREE.Float32BufferAttribute(B, 2));
  g.setAttribute('aAcr', new THREE.Float32BufferAttribute(A, 2));
  g.setIndex(I);
  return g;
}
const LILY_VERT = /* glsl */`
attribute vec2 aBud; attribute vec2 aAcr;
attribute vec4 iRoot;  // s, y, stem length, lean
attribute vec4 iMisc;  // seed, bud-opening u (negative: open from the start), head scale, metres off the wall
uniform float uTime, uU, uFloodS, uUnfinished;
varying vec2 vAcr; varying float vPart; varying vec3 vP; varying float vSketch;
#include <common>
#include <fog_pars_vertex>
${GLSL_GUST}
${GLSL_STRIP}
void main(){
  float part = position.z;
  float seed = iMisc.x;
  vec2 g = gustAt(iRoot.x);
  float bow = iRoot.w + 0.6 * g.x * (0.75 + 0.5 * fract(seed * 7.13)) + 0.03 * sin(uTime * 0.9 + seed * 6.283);
  float lim = mix(1.3, 0.3, step(${SE0.toFixed(1)}, iRoot.x));   // stiff on the east wall: nothing leans out over an opening
  bow = clamp(bow, -lim, lim);
  float L = iRoot.z;
  float open = iMisc.y < 0.0 ? 1.0 : smoothstep(iMisc.y, iMisc.y + 0.03, uU);
  vec3 rootP = stripToRoom(iRoot.xy, 0.1);
  float dist = length((modelViewMatrix * vec4(rootP, 1.0)).xyz);
  vec2 q;
  if (part < 0.5) {
    float t = position.y;
    vec2 c = vec2(L * bow * t * t, L * t * (1.0 - 0.2 * bow * bow * t));
    vec2 tg = normalize(vec2(2.0 * bow * t, 1.0 - 0.4 * bow * bow * t));
    float w = mix(0.075, 0.04, t) * (1.0 + 0.45 * sin(3.14159 * t));
    w = max(w, 0.0013 * dist);
    q = c + vec2(tg.y, -tg.x) * position.x * w;
    vAcr = vec2(position.x, w);
  } else {
    vec2 tip = vec2(L * bow, L * (1.0 - 0.2 * bow * bow));
    float ang = atan(2.0 * bow, 1.0 - 0.4 * bow * bow) * 1.25;
    vec2 h = mix(aBud, position.xy, open) * iMisc.z;
    float cs = cos(ang), sn = sin(ang);
    q = tip + vec2(h.x * cs + h.y * sn, -h.x * sn + h.y * cs);
    vAcr = vec2(aAcr.x, aAcr.y * iMisc.z * mix(0.5, 1.0, open));
  }
  vPart = part;
  // on the unfinished wall a lily is a red sketch until the colour has reached its root (one value for the whole lily)
  vSketch = uUnfinished * step(100.0, iRoot.x) * step(iRoot.x, 185.0) * (1.0 - smoothstep(-1.5, 1.5, uFloodS - iRoot.x - 4.0 * (fract(seed * 13.7) - 0.5)));
  vec3 P = stripToRoom(iRoot.xy + q, iMisc.w + 0.012 * part);
  vP = P;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const LILY_FRAG = /* glsl */`
uniform float uPetal, uStamen, uOutline;
varying vec2 vAcr; varying float vPart; varying vec3 vP; varying float vSketch;
#include <common>
#include <fog_pars_fragment>
${GLSL_SUN}
${GLSL_PIG}
void main(){
  float sun = sunAt(vP);
  float ed = (1.0 - abs(vAcr.x)) * vAcr.y;
  float aa = max(fwidth(ed), 1e-4);
  float lw = max(0.085, 1.2 * aa);
  float inner = smoothstep(lw - aa, lw + aa, ed);
  vec3 redP = pigment(1.0, sun);
  vec3 col = pigment(2.0, sun);
  if (vPart > 1.5) {
    col = pigment(uPetal, sun);
    if (uOutline > 0.5) col = mix(redP, col, inner);
    // the sketch: bare plaster inside one red line
    col = mix(col, mix(redP, pigment(0.0, sun), inner), vSketch);
  } else if (vPart > 0.5) {
    col = mix(pigment(uStamen, sun), redP, vSketch);
  } else {
    col = mix(col, redP, vSketch);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;
// u at which the camera of the brief's route is beside strip position s (for bud opening)
function passU(s, second) {
  if (s < 100) return second ? 0.63 + (s - 20) / 447 * 0.6 : (s + 2) / 447;
  if (s < 185) return 0.19 + ((s - 100) / 85) * 0.12;
  if (s < SE0) return 0.325 + ((s - 185) / 100) * 0.115;
  return 0.46 + ((s - SE0) / ELEN) * 0.09;
}
// instance data for `clumps` clumps of three chosen among `roots`
function lilyInstances(rng, roots, clumps) {
  const n = clumps * 3;
  const iRoot = new Float32Array(n * 4), iMisc = new Float32Array(n * 4);
  // spread the clumps: keep roots apart where there are enough to choose from
  const pool = [];
  for (const gap of [3.4, 2.2, 1.2, 0]) {
    for (const r of rng.shuffle(roots.slice())) {
      if (pool.length >= clumps) break;
      if (pool.includes(r)) continue;
      if (gap === 0 || pool.every((q) => Math.abs(q.s - r.s) > gap || Math.abs(q.y - r.y) > gap * 1.5)) pool.push(r);
    }
  }
  let k = 0;
  for (let c = 0; c < clumps; c++) {
    const r = pool[c % pool.length];
    const wrap = Math.floor(c / pool.length);
    const s0 = r.s + wrap * rng.range(-1.6, 1.6), lean = clamp(r.lean, -0.85, 0.85), baseL = rng.range(8, 14) * (1 - 0.3 * Math.abs(lean));
    const bud = rng.chance(0.25);
    const budU = clamp(passU(s0, rng.chance(0.4)) + rng.range(-0.05, 0.02), 0.02, 0.9);
    const order = rng.shuffle([-1, 0, 1]);
    for (let j = 0; j < 3; j++) {
      const sd = order[j];
      const L = Math.max(r.east ? 3.4 : 5, Math.min(baseL * (sd === 0 ? 1.08 : rng.range(0.78, 0.98)), (r.cap ?? 46.5) - r.y));
      iRoot[k * 4] = r.east ? clamp(s0 + sd * 0.45, SE0 + 0.4, SALL - 0.5) : clamp(s0 + sd * 0.45, 1, SLEN - 1); iRoot[k * 4 + 1] = r.y - Math.abs(sd) * 0.3;
      iRoot[k * 4 + 2] = L; iRoot[k * 4 + 3] = lean * 0.6 + sd * rng.range(0.16, 0.3) + rng.range(-0.04, 0.04);
      iMisc[k * 4] = rng(); iMisc[k * 4 + 1] = bud ? budU + j * 0.006 : -1;
      iMisc[k * 4 + 2] = rng.range(0.85, 1.15); iMisc[k * 4 + 3] = 0.12 + 0.012 * (k % 16);
      k++;
    }
  }
  return { iRoot, iMisc, n };
}
// one instanced mesh from several sets of instance data
function lilyMesh(sets, geometry, material) {
  const n = sets.reduce((a, q) => a + q.n, 0);
  const iRoot = new Float32Array(n * 4), iMisc = new Float32Array(n * 4);
  let o = 0;
  for (const q of sets) { iRoot.set(q.iRoot, o * 4); iMisc.set(q.iMisc, o * 4); o += q.n; }
  const g = new THREE.InstancedBufferGeometry();
  g.index = geometry.index;
  for (const name of ['position', 'aBud', 'aAcr']) g.setAttribute(name, geometry.getAttribute(name));
  g.setAttribute('iRoot', new THREE.InstancedBufferAttribute(iRoot, 4));
  g.setAttribute('iMisc', new THREE.InstancedBufferAttribute(iMisc, 4));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the swallow: one flat painted mark
// Plan view, beak toward +x, wings along +-y (6 m across), z = paint layer (0 plaster, 1 black, 2 red).
// aAnim.x = signed distance out from the wing hinge (0 on the body), aAnim.y = 0..1 along the tail streamers.
function buildSwallowGeometry() {
  const P = [], G = [], A = [], I = [];
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const spline = (pts, n) => new THREE.SplineCurve(pts.map((p) => V2(p[0], p[1]))).getPoints(n);
  const HINGE = 0.42;
  const push = (x, y, layer, pig, wingSg, tail) => {
    P.push(x, y, layer); G.push(pig);
    A.push(wingSg ? wingSg * Math.max(0, Math.abs(y) - HINGE) : 0, tail ? clamp((-x - 1.2) / 3.4, 0, 1) : 0);
  };
  const fill = (contour, layer, pig, wingSg = 0, tail = false) => {
    const b0 = P.length / 3;
    for (const p of contour) push(p.x, p.y, layer, pig, wingSg, tail);
    for (const f of THREE.ShapeUtils.triangulateShape(contour, [])) I.push(b0 + f[0], b0 + f[1], b0 + f[2]);
  };
  const rib = (pts, hw, layer, pig, wingSg = 0, tail = false) => {
    const b0 = P.length / 3, n = pts.length - 1;
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = hw(i / n);
      push(pts[i].x - ty * w, pts[i].y + tx * w, layer, pig, wingSg, tail);
      push(pts[i].x + ty * w, pts[i].y - tx * w, layer, pig, wingSg, tail);
      if (i < n) { const b2 = b0 + i * 2; I.push(b2, b2 + 1, b2 + 3, b2, b2 + 3, b2 + 2); }
    }
  };
  // body half width along x
  const bw = (x) => {
    if (x > 1.0) return 0.36 * Math.sqrt(Math.max(0, 1 - ((x - 1.0) / 0.4) * ((x - 1.0) / 0.4)));
    if (x > 0.2) return lerp(0.45, 0.36, smoothstep(0.2, 1.0, x));
    return lerp(0.12, 0.45, smoothstep(-1.25, 0.2, x));
  };
  const NB = 14, xs = [];
  for (let i = 0; i <= NB; i++) xs.push(lerp(-1.25, 1.4, i / NB));
  // wings: plaster fill, a swelling black leading edge, a fine trailing edge, three feather strokes
  for (const sg of [1, -1]) {
    const lead = spline([[0.6, 0.38], [0.82, 1.25], [0.25, 2.25], [-1.95, 3.0]].map(([x, y]) => [x, y * sg]), 12);
    const trail = spline([[-1.95, 3.0], [-0.95, 2.05], [-0.72, 1.15], [-0.5, 0.38]].map(([x, y]) => [x, y * sg]), 9);
    const contour = lead.concat(trail.slice(1));
    fill(sg > 0 ? contour.slice().reverse() : contour, 0, PIG.plaster, sg);
    rib(lead, (q) => 0.1 + 0.16 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * q)), 0.7) * (q > 0.97 ? 0.2 : 1), 1, PIG.black, sg);
    rib(trail, (q) => 0.03 + 0.085 * Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * q)), 1, PIG.black, sg);
    for (const [u0, len] of [[0.42, 0.95], [0.6, 0.8], [0.78, 0.6]]) {
      const a = lead[Math.round(u0 * 12)];
      const f = spline([[a.x, a.y], [a.x - len * 0.6, a.y - sg * 0.1], [a.x - len, a.y - sg * 0.32]], 3);
      rib(f, (q) => 0.085 * (1 - 0.75 * q), 1, PIG.black, sg);
    }
  }
  // tail: a plaster wedge and two long black streamers
  fill([V2(-1.15, 0.13), V2(-2.35, 0.42), V2(-2.0, 0), V2(-2.35, -0.42), V2(-1.15, -0.13)], 0, PIG.plaster, 0, true);
  for (const sg of [1, -1]) {
    const st = spline([[-1.1, 0.1 * sg], [-2.3, 0.4 * sg], [-3.6, 0.72 * sg], [-4.65, 1.15 * sg]], 10);
    rib(st, (q) => 0.17 * (1 - 0.55 * q) * (q > 0.96 ? 0.25 : 1), 1, PIG.black, 0, true);
  }
  // body: plaster spindle, black back and cap, red throat, fine belly line, beak
  const up = xs.map((x) => V2(x, bw(x))), dn = xs.map((x) => V2(x, -bw(x)));
  fill(dn.concat(up.slice().reverse()), 0, PIG.plaster);
  const mid = xs.map((x) => V2(x, bw(x) * (x > 0.7 ? lerp(0.12, -0.25, smoothstep(0.7, 1.3, x)) : 0.12)));
  fill(mid.concat(up.slice().reverse()), 1, PIG.black);
  const tx = []; for (let i = 0; i <= 6; i++) tx.push(lerp(0.5, 1.36, i / 6));
  const tTop = tx.map((x) => V2(x, bw(x) * lerp(0.0, -0.3, smoothstep(0.5, 1.3, x)))), tBot = tx.map((x) => V2(x, -bw(x)));
  fill(tBot.concat(tTop.slice().reverse()), 2, PIG.red);
  rib(xs.slice(0, 10).map((x) => V2(x, -bw(x) + 0.05)), (q) => 0.06 + 0.05 * Math.sin(Math.PI * q), 1, PIG.black);
  fill([V2(1.3, 0.13), V2(1.3, -0.1), V2(1.9, 0.0)], 1, PIG.black);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aPig', new THREE.Float32BufferAttribute(G, 1));
  g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 2));
  g.setIndex(I);
  return g;
}
const BIRD_VERT = /* glsl */`
attribute float aPig; attribute vec2 aAnim;
attribute vec4 iState;   // wing angle, air 0..1, seed, opacity (ghost only)
uniform float uTime, uGhost;
varying float vPig; varying vec3 vP; varying float vA;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = vec3(position.xy, 0.0);
  float r = abs(aAnim.x), sg = sign(aAnim.x);
  float ang = iState.x * (0.35 + 0.65 * smoothstep(0.0, 2.6, r)) * (1.0 - uGhost);
  if (r > 0.0) { p.y = sg * (0.42 + r * cos(ang)); p.z = r * sin(ang); }
  float tl = aAnim.y;
  p.y += tl * tl * 0.55 * sin(uTime * 7.0 + iState.z * 6.283 - tl * 3.0) * iState.y * (1.0 - uGhost);
  p.z += tl * tl * 0.35 * sin(uTime * 5.3 + iState.z * 9.1 - tl * 2.4) * iState.y * (1.0 - uGhost);
  p.z += position.z * 0.014;
  vec4 lp = iMat * vec4(p, 1.0);
  vP = lp.xyz; vPig = aPig; vA = iState.w;
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const BIRD_FRAG = /* glsl */`
uniform float uGhost;
uniform vec3 uGhostCol, uGhostSun, uGhostLine;
varying float vPig; varying vec3 vP; varying float vA;
#include <common>
#include <fog_pars_fragment>
${GLSL_SUN}
${GLSL_PIG}
void main(){
  float sun = sunAt(vP);
  vec3 col = pigment(vPig, sun);
  float a = 1.0;
  if (uGhost > 0.5) { col = mix(mix(uGhostCol, uGhostSun, sun), uGhostLine * mix(1.0, 1.08, sun), step(0.5, vPig) * step(vPig, 4.5) * 0.85); a = vA; }
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- choreography: forty birds, all keyed to u
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const ease = (q) => { const t = clamp(q, 0, 1); return t * t * (3 - 2 * t); };
function crEval(pts, q, out) {
  const n = pts.length - 1, x = clamp(q, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const t2 = t * t, t3 = t2 * t;
  const a = -0.5 * t3 + t2 - 0.5 * t, b = 1.5 * t3 - 2.5 * t2 + 1, c = -1.5 * t3 + 2 * t2 + 0.5 * t, d = 0.5 * t3 - 0.5 * t2;
  return out.set(a * p0.x + b * p1.x + c * p2.x + d * p3.x, a * p0.y + b * p1.y + c * p2.y + d * p3.y, a * p0.z + b * p1.z + c * p2.z + d * p3.z);
}
// Hermite through keys {u, p, m} (m = velocity per unit u), C1 in u
function keyEval(keys, u, out) {
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const k0 = keys[i], k1 = keys[i + 1], h = Math.max(1e-6, k1.u - k0.u), t = clamp((u - k0.u) / h, 0, 1), t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = (t3 - 2 * t2 + t) * h, h01 = -2 * t3 + 3 * t2, h11 = (t3 - t2) * h;
  return out.set(h00 * k0.p.x + h10 * k0.m.x + h01 * k1.p.x + h11 * k1.m.x, h00 * k0.p.y + h10 * k0.m.y + h01 * k1.p.y + h11 * k1.m.y, h00 * k0.p.z + h10 * k0.m.z + h01 * k1.p.z + h11 * k1.m.z);
}
function finishKeys(keys) {
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.m) continue;   // a key that brings its own velocity (the kiss, carried along ahead of the eye)
    if (k.stop || i === 0 || i === keys.length - 1) { k.m = new THREE.Vector3(); continue; }
    const a = keys[i - 1], b = keys[i + 1];
    k.m = b.p.clone().sub(a.p).multiplyScalar(1 / Math.max(1e-6, b.u - a.u));
  }
  return keys;
}
const FLOOD_LEAD = 17;
const HERO_U = { lift: 0.35, off: 0.362, kiss0: 0.795, kiss1: 0.818, kiss2: 0.922, kiss3: 0.952, back: 9, down: 9 };
// THE LEAVING (round four). From u 0.636 every swallow comes off the plaster for good (its pale ghost stays on the wall)
// and falls into one ribbon, FIN.len metres long, that flies FIN.pts: west along the top of the north wall, down across
// the north-west of the room over the loom, round in front of the west wall and east low over the bed, round by the
// door, back west along the south wall climbing, over the south-west corner above the eye, and then down the middle of
// the room, over the kissing pair, into the window and out to sea.
// FIN.s = [u, metres along the course of the leading bird]: about 20 m/s on the clock (the eye lingers from 0.72 to 0.83);
// the ribbon slows and hangs over the kiss (0.75-0.818: its leading birds come down between the pair's raised wings to
// the head of the window as the pair parts) and then pours out at 27 m/s; past FIN.dive the birds draw apart (x 1.5).
const FIN = {
  len: 172, dive: 347,
  pts: [[40, 60, -30], [20, 58, -34], [0, 54, -33], [-18, 45, -26], [-32, 36, -14], [-38, 29.5, -5], [-31.5, 27, 0.5], [-17, 26.5, 2], [0, 26.5, 1.5],
    [14, 28, 3], [25, 31, 8.5], [32.5, 34, 18], [29, 38, 29.5], [12, 43, 33], [-10, 49, 33], [-30, 55, 30], [-41, 58, 16], [-38, 60, 5],
    [-28, 61, -1], [-10, 58.5, -0.5], [10, 55, -0.5], [30, 49, -0.5], [42, 44.5, -0.5], [50, 41.5, -0.5], [64, 41, -0.5], [88, 47, -1], [130, 62, -2], [200, 90, -4]],
  s: [[0.62, 145], [0.64, 160], [0.66, 175], [0.68, 192], [0.70, 215], [0.72, 247], [0.75, 303], [0.79, 352], [0.818, 365], [0.83, 395], [0.87, 475], [0.905, 523], [0.94, 543], [0.97, 556], [1.0, 568]],
  off0: 0.636, offSpan: 0.032,
};
// the rare tremor's wheel: five tiers [scale of the ring, metres above the lowest], a cone of rings, every bird in phase
const TIERS = [[1, 0], [0.8, 4.6], [0.6, 9], [0.42, 13], [0.26, 16.5]];

function makeFlock(rng) {
  const birds = [];
  const used = [];   // rest spots taken: [s, y]
  const freeSpot = (s0, s1, y0, y1, gap) => {
    for (let k = 0; k < 60; k++) {
      const s = rng.range(s0, s1), y = rng.range(y0, y1);
      if (used.every((q) => Math.abs(q[0] - s) > gap || Math.abs(q[1] - y) > 7)) return [s, y];
    }
    return [rng.range(s0, s1), rng.range(y0, y1)];
  };
  const addBird = (pair, role, s, y, ang, hero = false) => {
    const b = { i: birds.length, pair, role, s, y, ang, hero, seed: rng(), flights: [], keys: null, sgn: 1,
      wallP: new THREE.Vector3(), wallOut: new THREE.Vector3(), wf: new THREE.Vector3(), wn: new THREE.Vector3(), wl: new THREE.Vector3(),
      pf: new THREE.Vector3(), face: new THREE.Vector3(), face2: new THREE.Vector3(1, 0, 0), flock: [rng.range(-1.1, 0), rng.range(-8, 8), rng.range(-8, 8)], ring: (birds.length * 0.618034) % 1 };
    used.push([s, y]);
    stripToRoom(s, y, 0.4, b.wallP); stripToRoom(s, y, 1.7, b.wallOut);
    wallFrame(s, _a, b.wn);
    b.wf.copy(_a).multiplyScalar(Math.cos(ang)).addScaledVector(UP, Math.sin(ang));
    b.wl.crossVectors(b.wn, b.wf); if (b.wl.y < 0) b.wl.negate();
    b.pf.copy(b.wf);
    birds.push(b); return b;
  };
  // a pair at rest: facing each other, or apart
  const addPair = (pair, s0, s1, y0, y1, hero = false, facing = rng.chance(0.65)) => {
    const [s, y] = freeSpot(s0 + 5, s1 - 5, y0, y1, 13);
    if (facing) {
      const g = rng.range(3.4, 4.3), tilt = rng.range(-0.2, 0.25);
      return [addBird(pair, 0, s - g, y + rng.range(-0.6, 0.6), tilt, hero), addBird(pair, 1, s + g, y + rng.range(-0.6, 0.6), Math.PI - tilt * rng.range(0.4, 1.2), hero)];
    }
    const a = addBird(pair, 0, s, y, rng.range(-0.5, 0.6) + (rng.chance(0.5) ? Math.PI : 0), hero);
    const [s2, y2] = freeSpot(Math.max(s0 + 5, s - 30), Math.min(s1 - 5, s + 30), y0, y1, 11);
    return [a, addBird(pair, 1, s2, y2, rng.range(-0.5, 0.6) + (rng.chance(0.5) ? Math.PI : 0), hero)];
  };
  const pairs = [];
  // pair 0: the seventh pair of the brief, nested low on the north wall at the east edge of the sun shape
  used.push([259, 22]);
  pairs.push({ hero: true, birds: [addBird(0, 0, 254.6, 22.4, 0.12, true), addBird(0, 1, 263.4, 21.6, Math.PI - 0.1, true)] });
  // pairs 1..6: the taught kisses. spans: where they rest; win: [u0, u1]; ph: phase ends (peel, out, hold, back)
  const taught = [
    { rest: [104, 124, 46, 52], win: [0.03, 0.25], ph: [0.08, 0.5, 0.69, 0.95], meet: [-33, 22.5, 10], at: [0.16, -9.5, 12.5, -18.5] },
    { rest: [138, 168, 47, 60], win: [0.16, 0.33], ph: [0.07, 0.42, 0.66, 0.94], meet: [-42.5, 18.5, -15.5], at: [0.25, -5, 10, -21] },
    { rest: [196, 226, 47, 60], win: [0.27, 0.43], ph: [0.07, 0.44, 0.6, 0.94], meet: [-12, 25, -27] },
    { rest: [236, 280, 48, 62], win: [0.43, 0.59], ph: [0.07, 0.44, 0.6, 0.94], meet: [45, 41, -19] },   // beside the window, as the animal runs on the sill
    { rest: [4, 34, 47, 60], win: [0.49, 0.66], ph: [0.07, 0.44, 0.6, 0.94], meet: [6, 45, 17] },
    { rest: [40, 78, 50, 64], win: [0.6, 0.77], ph: [0.07, 0.44, 0.6, 0.94], meet: [2, 50, 35] },
  ];
  taught.forEach((t, k) => {
    const bs = addPair(k + 1, t.rest[0], t.rest[1], t.rest[2], t.rest[3], false, true);
    pairs.push({ birds: bs, flights: [{ u0: t.win[0], u1: t.win[1], ph: t.ph, meet: new THREE.Vector3(...t.meet), at: t.at || null }], taught: true });
  });
  // pairs 7..19: the rest of the colony, two flights each, spread so about ten more birds are always out
  for (let k = 7; k < 20; k++) {
    const wall = k % 3, span = wall === 0 ? [0, 100] : wall === 1 ? [100, 185] : [185, 285];
    const bs = addPair(k, span[0], span[1], 47, 66);
    const flights = [];
    let u0 = -0.1 + ((k - 7) / 13) * 0.5 + rng.range(-0.02, 0.02);
    for (let f = 0; f < 2; f++) {
      const len = rng.range(0.17, 0.23);
      const m = new THREE.Vector3(rng.range(-32, 32), rng.range(44, 63), rng.range(-27, 27));
      flights.push({ u0, u1: u0 + len, ph: [0.07, 0.44, 0.6, 0.94], meet: m });
      u0 += len + rng.range(0.24, 0.34);
    }
    pairs.push({ birds: bs, flights });
  }
  // Four loose flocks of eight. Each rests as a cluster low enough on its wall to be seen, leaves the plaster bird after
  // bird, flies as a loose group where the eye is looking and goes back to lie in its ghosts.
  // way: ['L', u, metres ahead of the eye along the route, metres to the right, metres above] or ['A', u, x, y, z]
  // fan: metres between neighbours across the line of flight, so that a flock seen from behind is eight separate marks
  // trail: { pts: the course in the room, s: [[u, metres along the course of the leading bird], ...], gap } : every
  // other bird flies the same course `gap` metres behind the one before it, so the flock is a string of separate marks
  // more than a wingspan apart, seen from the side wherever the course runs across the gaze (never a knot seen end-on).
  // sink: [metres, u0, u1, u2, u3] lowers the whole string for a while.
  const FLOCKS = [
    { rest: [62, 96, 40, 54], ang: 0.15, flights: [
      { u0: -0.02, back: 0.105, sp: 0.7, fan: 4.5, way: [['L', 0.05, 26, 5, 13], ['L', 0.068, 26, 5, 15], ['L', 0.085, 24, 5, 14]] }] },
    // (the second flock is home before the store jars: nothing flies across them)
    { rest: [124, 165, 44, 57], ang: Math.PI - 0.2, flights: [
      { u0: 0.125, back: 0.232, sp: 1, fan: 3.6, way: [['L', 0.185, 26, -2, 15], ['L', 0.205, 26, -3, 17]] }] },
    { rest: [192, 240, 46, 58], ang: 0.2, flights: [
      { u0: 0.255, back: 0.365, sp: 0.55, fan: 4.6, way: [['L', 0.325, 21, 4, 8.5], ['L', 0.342, 21, 4, 9]] }] },
    // the fourth flock leaves the top of the window wall above the eye's frame, crosses the room under the joists, comes
    // down in the south-west corner and runs north along the west wall and east along the north wall as one long string
    // while the eye looks across the room from the height of the lily heads (u 0.58-0.70); then it climbs home
    { rest: [SE0 + 3, SE0 + 82, 58.5, 66.5], ang: Math.PI - 0.15, flights: [
      { u0: 0.478, back: 0.75, sp: 0, sink: [7, 0.6, 0.645, 0.7, 0.73], trail: { gap: 7.4,
        pts: [[2, 62, 14], [-14, 56, 23], [-29, 37.5, 27.5], [-36.5, 36.5, 13], [-37.5, 36.5, -6], [-37, 36.5, -22], [-30, 36.5, -33], [-15, 37, -36.5], [2, 38, -35.5], [19, 41, -31], [34, 55, -14]],
        s: [[0.531, 0], [0.55, 30], [0.568, 58], [0.587, 85], [0.605, 99], [0.66, 113], [0.685, 133], [0.708, 156], [0.735, 190]] } }] },
    // the fifth flock: fourteen birds high on the south wall. They leave as the eye comes through the sun (u 0.35), wheel
    // as one ring under the reed ceiling while the eye looks up at it (0.40-0.45), each a wingspan and a half from the
    // next, and lie down again (0.49-0.55). ring: centre, radius, tilt, metres the ring turns per unit u
    { n: 14, rest: [5, 60, 60.5, 67.5], ang: Math.PI - 0.1, flights: [
      { u0: 0.345, back: 0.492, sp: 0, ring: { c: [10, 47.5, 3], r: 17.5, tilt: 2.6, turn: 620 } }] },
  ];
  for (const F of FLOCKS) {
    const bs = [];
    for (let j = 0; j < (F.n || 8); j++) {
      const [s, y] = freeSpot(F.rest[0], F.rest[1], F.rest[2], F.rest[3], F.n ? 5.5 : 6.5);
      const b = addBird(pairs.length, j, s, y, F.ang + rng.range(-0.3, 0.3));
      // an echelon: each bird further ahead flies higher, so that seen from behind the flock is a rising diagonal of
      // separate marks, never a knot
      const rank = ((j * 3) % 8) - 3.5;
      b.off = [(rank + 3.5) * 5.5, rng.range(-5, 5), rank * 4 + rng.range(-1.5, 1.5), rng.range(0, TAU)];
      bs.push(b);
    }
    pairs.push({ birds: bs, loose: true, flights: F.flights.map((f) => ({ u0: f.u0, u1: f.back + 0.05, back: f.back, sp: f.sp, way: f.way, trail: f.trail, ring: f.ring, sink: f.sink, fan: f.fan || 0, per: null })) });
  }
  const flock = { birds, pairs, kiss: new THREE.Vector3(), kissFwd: new THREE.Vector3(1, 0, 0), kissLeft: new THREE.Vector3(0, 0, -1), path: null };

  // (re)build every flight curve for a camera path. Refills plain arrays only.
  flock.setPath = (path) => {
    flock.path = path;
    const lead = 28 / path.length;
    const pk = path.pointAt(0.8), pe = path.pointAt(0.87);
    flock.kissFwd.copy(pe).sub(pk).setY(0);
    if (flock.kissFwd.lengthSq() < 1e-6) flock.kissFwd.set(1, 0, 0);
    flock.kissFwd.normalize();
    flock.kissLeft.crossVectors(UP, flock.kissFwd).normalize();
    flock.kiss.copy(pk).addScaledVector(flock.kissFwd, 14);
    const K = flock.kiss, F = flock.kissFwd, L = flock.kissLeft;
    for (const pr of pairs) {
      if (pr.loose) {
        for (const fl of pr.flights) {
          // the course of a string: a smooth curve through its points, measured in metres
          let courseAt = null, sAt = null;
          if (fl.trail) {
            const cp = fl.trail.pts.map((q) => new THREE.Vector3(q[0], q[1], q[2])), NS = 220, cs = [], cl = [0];
            for (let i = 0; i <= NS; i++) { cs.push(crEval(cp, i / NS, new THREE.Vector3())); if (i) cl.push(cl[i - 1] + cs[i].distanceTo(cs[i - 1])); }
            courseAt = (sm, out) => {
              const x = clamp(sm, 0, cl[NS] - 1e-3);
              let i = 0; while (i < NS - 1 && cl[i + 1] < x) i++;
              return out.copy(cs[i]).lerp(cs[i + 1], (x - cl[i]) / Math.max(1e-6, cl[i + 1] - cl[i]));
            };
            const sk = fl.trail.s;
            sAt = (u) => { let i = 0; while (i < sk.length - 2 && u > sk[i + 1][0]) i++; return lerp(sk[i][1], sk[i + 1][1], clamp((u - sk[i][0]) / (sk[i + 1][0] - sk[i][0]), 0, 1)); };
          }
          fl.per = pr.birds.map((b, j) => {
            const uA = fl.u0 + (fl.ring ? 0.002 : fl.trail ? 0.003 : 0.005) * j, uOff = uA + 0.013, uBack = fl.back + 0.004 * j, uD = uBack + 0.013;
            const keys = [];
            const key = (u, p) => keys.push({ u, p: p.clone(), stop: false });
            key(uOff, b.wallOut);
            key(uOff + 0.012, _a.copy(b.wallP).addScaledVector(b.wn, 9).addScaledVector(UP, 2).addScaledVector(b.wf, 5));
            if (fl.ring) {
              // the ring: every bird has its own place round a tilted circle, and the circle turns
              const R = fl.ring, n = pr.birds.length;
              for (let u = uOff + 0.03; u < uBack - 0.026; u += 0.006) {
                const th = TAU * (j / n) + (R.turn * (u - fl.u0)) / R.r, rr = R.r + 1.3 * Math.sin(j * 2.4);
                key(u, _a.set(R.c[0] + rr * Math.cos(th), R.c[1] + R.tilt * Math.sin(th + 0.8) + 0.9 * Math.sin(j * 1.7), R.c[2] + rr * Math.sin(th)));
              }
            } else if (courseAt) {
              // the string: this bird is j gaps behind the leader along the course (the flock is bunched while it crosses
              // the room under the joists, strings out as it comes down, and the gaps close again as it climbs home)
              const sk = fl.sink, zig = (j & 1 ? -1.3 : 1.3) + 0.2 * b.off[1];
              for (let u = fl.trail.s[0][0]; u < uBack - 0.03; u += 0.007) {
                const sj = sAt(u) - j * fl.trail.gap * (0.25 + 0.75 * smoothstep(0.525, 0.59, u)) * (1 - 0.55 * smoothstep(0.685, 0.72, u));
                if (sj < 0 || u < uOff + 0.04) continue;
                courseAt(sj, _a);
                _a.y += (sk ? -sk[0] * smoothstep(sk[1], sk[2], u) * (1 - smoothstep(sk[3], sk[4], u)) : 0) + zig + 0.7 * Math.sin(u * 80 + b.off[3]);
                _a.z += 0.7 * Math.cos(u * 60 + b.off[3]);
                key(u, _a.set(clamp(_a.x, -RX + 2.5, RX - 2.5), clamp(_a.y, 3.5, RH - 6), clamp(_a.z, -RZ + 2.5, RZ - 2.5)));
              }
            } else for (const w of fl.way) {
              const u = w[1], wv = Math.sin(u * 90 + b.off[3]) * 1.5, wh = Math.cos(u * 70 + b.off[3]) * 1.2, sp = fl.sp;
              if (w[0] === 'L') {
                const uu = clamp(u + (w[2] + b.off[0] * sp) / path.length, 0, 1);
                const base = path.pointAt(uu, _a), T = path.tangentAt(uu, _b).setY(0).normalize();
                const side = _c.crossVectors(T, UP);
                base.addScaledVector(side, w[3] + b.off[1] * sp + wv + fl.fan * (j - 3.5)).addScaledVector(UP, w[4] + b.off[2] * sp + wh);
              } else _a.set(w[2] + 0.35 * b.off[1] * sp, w[3] + b.off[2] * sp + wh, w[4] + (b.off[0] - 19) * sp + wv);
              // a flat mark stays in the room: never nearer than 2.5 m to a wall, the floor or the joists
              key(u, _a.set(clamp(_a.x, -RX + 2.5, RX - 2.5), clamp(_a.y, 3.5, RH - 6), clamp(_a.z, -RZ + 2.5, RZ - 2.5)));
            }
            key(uBack - 0.016, _a.copy(b.wallP).addScaledVector(b.wn, 10).addScaledVector(UP, 3).addScaledVector(b.wf, -6));
            key(uBack, b.wallOut);
            return { uA, uOff, uBack, uD, keys: finishKeys(keys) };
          });
        }
        continue;
      }
      if (pr.hero) {
        pr.birds.forEach((b, i) => {
          const sd = i === 0 ? 1 : -1;   // bird 0 comes in on the left
          const keys = [];
          const key = (u, p, stop = false, m = null) => keys.push({ u, p: p.clone(), stop, m });
          key(HERO_U.off, b.wallOut);
          // off the wall: a slow courting spiral in front of their own ghosts, 5 m off the north wall and drifting
          // east, so the pair is seen whole against bare plaster (never across the niche) until the eye turns south
          const nest = _d.copy(pr.birds[0].wallP).add(pr.birds[1].wallP).multiplyScalar(0.5);
          for (let u = 0.374; u < 0.428; u += 0.012) {
            const q = (u - HERO_U.off) / 0.05, ang = TAU * 0.8 * q + (i ? Math.PI : 0) + 0.4;
            const grow = smoothstep(0, 0.35, q);
            _a.copy(b.wallP).lerp(nest, grow).addScaledVector(b.wn, 2 + 3.4 * grow);
            key(u, _a.add(_b.set(6 * q + 5.6 * grow * Math.cos(ang), 0.5 + 2.6 * q + 4.2 * grow * Math.sin(ang), 0)));
          }
          // then up and over the niche (above its lintel as the eye sees it) to lead us round to the window
          key(0.437, _a.set(35 - i * 3, 33.5 + i * 3, -15 + i * 4));
          for (let u = 0.45; u < 0.725; u += 0.03) {
            const base = path.pointAt(u + lead, _a), T = path.tangentAt(u + lead, _b).setY(0).normalize();
            const side = _c.crossVectors(T, UP);
            const w = Math.sin(((u - 0.42) / 0.3) * TAU * 1.5 + (i ? Math.PI : 0));
            const h = 4.2 + 2.6 * Math.cos(((u - 0.42) / 0.3) * TAU * 1.5 + (i ? Math.PI : 0)) + 2.0 * smoothstep(0.42, 0.6, u);
            // (while the eye looks across the room, 0.59-0.67, the pair keeps to the south wall on our left, out of the picture)
            const aside = -9.5 * smoothstep(0.55, 0.59, u) * (1 - smoothstep(0.65, 0.69, u));
            key(u, base.addScaledVector(side, 5.5 * w * (1 + aside / 16) + aside).addScaledVector(UP, h));
          }
          key(0.748, _a.copy(K).addScaledVector(L, sd * 19).addScaledVector(UP, 6.5).addScaledVector(F, 7));
          key(0.773, _a.copy(K).addScaledVector(L, sd * 9.5).addScaledVector(UP, -2.6).addScaledVector(F, 2.5));
          const seat = _d.copy(K).addScaledVector(L, sd * 2.02).addScaledVector(F, -1.5);
          // the hold: the pair hangs beak to beak and is carried along at the eye's own speed, so it stays 16 m ahead and
          // each bird a third of the frame high (it no longer grows until it hides the window)
          const carry = F.clone().multiplyScalar(path.length);
          key(HERO_U.kiss0, seat, true, carry.clone());
          key(HERO_U.kiss1, _b.copy(seat).addScaledVector(F, path.length * (HERO_U.kiss1 - HERO_U.kiss0)), true, carry.clone());
          // after the kiss they part to left and right and fly on AHEAD of the eye, wings toward us, up beside the
          // window against the bare plaster above the niche and the door, until the eye overtakes them
          const lead2 = (u, f, l, h) => key(u, path.pointAt(u, _a).addScaledVector(F, f + i * 1.5).addScaledVector(L, sd * l).addScaledVector(UP, h + i * (u < 0.86 ? 3.1 : 2.2)));
          lead2(0.834, 15, 6.5, 2.5);
          lead2(0.85, 19.5, 11.5, 5.8);
          lead2(0.866, 20.5, 12.6, 6.8);
          lead2(0.882, 19.5, 13.2, 7);
          // (round four) no going home: the pair turns in after the flock, meets again beak to beak in the window opening
          // itself against the portal's light (kiss2-kiss3), and rises out over the sea as the eye comes under it
          const K2 = _d.set(WIN.x + 10.5, WIN.y + 6.6, WIN.z);
          key(0.903, _a.copy(K2).addScaledVector(L, sd * 5.5).add(_b.set(-9, 1.5 + i * 1.5, 0)));
          const seat2 = K2.clone().addScaledVector(L, sd * 2.02);
          key(HERO_U.kiss2, seat2, true);
          key(HERO_U.kiss3, seat2, true);
          key(0.975, _a.copy(seat2).addScaledVector(L, sd * 1.5).add(_b.set(11.5, 4.4, 0)));
          key(0.999, _a.copy(seat2).addScaledVector(L, sd * 6).add(_b.set(40, 20, 0)));
          b.keys = finishKeys(keys);
          b.face.copy(L).multiplyScalar(-sd);
          b.face2.copy(L).multiplyScalar(sd * 0.8).addScaledVector(UP, 0.52).addScaledVector(F, 0.22).normalize();
        });
        continue;
      }
      for (const fl of pr.flights) {
        // (a kiss the eye stands back for hangs where the eye will be looking: so far ahead of, beside and above the route)
        if (fl.at) { path.pointAt(fl.at[0], fl.meet); fl.meet.set(clamp(fl.meet.x + fl.at[1], -RX + 7.5, RX - 8), fl.meet.y + fl.at[2], clamp(fl.meet.z + fl.at[3], -RZ + 8, RZ - 8)); }
        const uMeet = fl.u0 + (fl.u1 - fl.u0) * (fl.ph[1] + fl.ph[2]) * 0.5;
        fl.uMeet = uMeet;
        const cam = path.pointAt(clamp(uMeet, 0, 1), _a);
        const view = _b.copy(fl.meet).sub(cam).setY(0);
        if (view.lengthSq() < 1) view.set(1, 0, 0);
        const face = new THREE.Vector3().crossVectors(UP, view.normalize()).normalize();
        fl.face = face;
        fl.curves = pr.birds.map((b, i) => {
          const sd = i === 0 ? 1 : -1;
          // bird 0 sits on the +face side of the meeting point looking back along -face
          if (i === 0 && _c.copy(b.wallP).sub(fl.meet).dot(face) < _d.copy(pr.birds[1].wallP).sub(fl.meet).dot(face)) face.negate();
          const seat = fl.meet.clone().addScaledVector(face, sd * 2.02);
          const mid = b.wallP.clone().lerp(seat, 0.5);
          const out = [b.wallOut.clone(),
            b.wallP.clone().addScaledVector(b.wn, 10).addScaledVector(UP, 3 + i * 2).addScaledVector(b.wf, 6),
            mid.clone().addScaledVector(face, sd * 9).addScaledVector(UP, 7 - i * 5),
            seat.clone().addScaledVector(face, sd * 8).addScaledVector(UP, 4 - i * 2).addScaledVector(view, -3 * sd),
            seat];
          const back = [seat,
            seat.clone().addScaledVector(face, sd * 7).addScaledVector(UP, 5 + i * 2).addScaledVector(view, 4 * sd),
            mid.clone().addScaledVector(face, sd * 5).addScaledVector(UP, 9 - i * 3).addScaledVector(b.wn, 6),
            b.wallP.clone().addScaledVector(b.wn, 10).addScaledVector(UP, 3).addScaledVector(b.wf, -7),
            b.wallOut.clone()];
          return { out, back, seat, face: face.clone().multiplyScalar(-sd) };
        });
      }
    }
    // ---- THE LEAVING: one place in the ribbon for every bird but the seventh pair
    // (a step of its own when the hero is built: flock.defer puts it off to flock.leave(), with a yield between)
    for (const b of birds) b.fin = null;
    flock.leave = () => {
    const cp = FIN.pts.map((q) => new THREE.Vector3(q[0], q[1], q[2])), NS = 420, cs = [], cl = [0];
    for (let i = 0; i <= NS; i++) { cs.push(crEval(cp, i / NS, new THREE.Vector3())); if (i) cl.push(cl[i - 1] + cs[i].distanceTo(cs[i - 1])); }
    const total = cl[NS];
    const courseAt = (sm, out, tan) => {
      const x = clamp(sm, 0, total - 1e-3);
      let lo = 0, hi = NS;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cl[m] <= x) lo = m; else hi = m; }
      if (tan) tan.copy(cs[lo + 1]).sub(cs[lo]).normalize();
      return out.copy(cs[lo]).lerp(cs[lo + 1], (x - cl[lo]) / Math.max(1e-6, cl[lo + 1] - cl[lo]));
    };
    const sk = FIN.s;
    const sHead = (u) => { let i = 0; while (i < sk.length - 2 && u > sk[i + 1][0]) i++; return lerp(sk[i][1], sk[i + 1][1], clamp((u - sk[i][0]) / (sk[i + 1][0] - sk[i][0]), -1, 2)); };
    flock.finCourse = courseAt; flock.finHead = sHead; flock.finTotal = total;
    // a bird takes the place nearest to where it is: those by the door lead, those on the north wall bring up the rear
    const list = birds.filter((b) => !b.hero), N = list.length, ref = sHead(0.67), tan = new THREE.Vector3(), side = new THREE.Vector3();
    const info = list.map((b) => {
      const p0 = birdPos0(b, pairs[b.pair], 0.652, new THREE.Vector3());
      let best = ref, bd = 1e9;
      for (let sm = ref - FIN.len; sm <= ref; sm += 2) { const d = courseAt(sm, _a).distanceToSquared(p0); if (d < bd) { bd = d; best = sm; } }
      return { b, at: best };
    });
    info.sort((x, y) => y.at - x.at || x.b.i - y.b.i);
    info.forEach((q, rank) => {
      const b = q.b, pair = pairs[b.pair], lag = (FIN.len * (rank + 0.5)) / N;
      // the rear leaves the plaster first (it is the north and west walls, ahead of the eye), the van last
      const uOff = FIN.off0 + FIN.offSpan * (1 - rank / Math.max(1, N - 1)) * (0.75 + 0.25 * b.seed), uA = uOff - 0.013;
      birdPos0(b, pair, uA, _a, ST);
      const air0 = ST.wall < 1 || ST.lift > 0.001;
      const keys = [];
      let wall0 = 1, ghost0 = 1;
      if (air0) {
        // already flying (or lifting, or lying down) when its turn comes: it goes on from where it is
        const p0 = birdPos0(b, pair, uOff, new THREE.Vector3(), ST);
        wall0 = ST.wall; ghost0 = ST.ghost;
        birdPos0(b, pair, uOff - 0.004, _b);
        keys.push({ u: uOff, p: p0, stop: false, m: p0.clone().sub(_b).multiplyScalar(1 / 0.004) });
      } else {
        keys.push({ u: uOff, p: b.wallOut.clone(), stop: true });
        keys.push({ u: uOff + 0.012, p: b.wallP.clone().addScaledVector(b.wn, 9).addScaledVector(UP, 2).addScaledVector(b.wf, 5), stop: false });
      }
      // its place across the ribbon: a low-discrepancy scatter, so that neighbours along it never sit on one another
      const ca = ((rank * 0.754878) % 1) * 2 - 1, cb = ((rank * 0.569840) % 1) * 2 - 1;
      for (let u = uOff + 0.032; u <= 1.0061; u += 0.006) {
        const s0 = sHead(u) - lag, sm = s0 < FIN.dive ? s0 : FIN.dive + (s0 - FIN.dive) * 1.5;
        courseAt(sm, _a, tan);
        side.set(-tan.z, 0, tan.x); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
        // the ribbon is 14 m wide and 8 m deep in the room, draws in to pass the window, and opens again over the sea
        const inw = smoothstep(335, 370, sm), outw = smoothstep(392, 450, sm);
        const A = lerp(7.8, 5.6, inw) + 10 * outw, B = lerp(5.4, 7.4, inw) + 6 * outw;
        _a.addScaledVector(side, ca * A).addScaledVector(UP, cb * B + 0.5 * Math.sin(u * 70 + b.seed * 40));
        if (sm < 372) _a.set(clamp(_a.x, -RX + 3, RX - 3), clamp(_a.y, 4, RH - 6), clamp(_a.z, -RZ + 3, RZ - 3));
        keys.push({ u, p: _a.clone(), stop: false });
        if (sm > total - 3) break;
      }
      b.fin = { uA: air0 ? uOff : uA, uOff, wall0, ghost0, keys: finishKeys(keys), lag };
    });
    };
    if (!flock.defer) flock.leave();
  };
  // the rare wheel: tiers of a cone, the birds evenly spaced round each
  {
    const TS = TIERS.reduce((a, t) => a + t[0], 0);
    let bi = 0;
    TIERS.forEach((t, k) => {
      const n = k === TIERS.length - 1 ? birds.length - bi : Math.round((birds.length * t[0]) / TS);
      for (let j = 0; j < n && bi < birds.length; j++, bi++) { birds[bi].tier = k; birds[bi].ring = j / n + 0.37 * k; }
    });
  }
  return flock;
}

const RING = { x: -13, y: 34, z: 2, rx: 17, rz: 29, tilt: 3.5 };   // the wheeling flock of the rare tremor
const ST = { wall: 1, hold: 0, lift: 0, ghost: 0, face: null };
const POSE = { air: 0, hold: 0 };
// where bird b is at progress u (and, if st is given, how it is held: on the wall, lifting, hovering)
function birdPos(b, pair, u, out, st) {
  const f = b.fin;
  if (!f || u <= f.uA) return birdPos0(b, pair, u, out, st);
  if (u < f.uOff) {
    const l = ease((u - f.uA) / (f.uOff - f.uA));
    if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = l; }
    return out.copy(b.wallP).lerp(b.wallOut, l * l);
  }
  if (st) { st.wall = f.wall0 * (1 - smoothstep(f.uOff, f.uOff + 0.014, u)); st.hold = 0; st.lift = 1; st.ghost = lerp(f.ghost0, 1, smoothstep(f.uOff, f.uOff + 0.012, u)); st.face = null; }
  return keyEval(f.keys, u, out);
}
// (the life of a bird before the leaving)
function birdPos0(b, pair, u, out, st) {
  if (b.hero) {
    const H = HERO_U;
    if (u <= H.lift || u >= H.down || !b.keys) { if (st) { st.wall = 1; st.hold = 0; st.lift = 0; st.ghost = 0; } return out.copy(b.wallP); }
    if (u < H.off) {
      const l = ease((u - H.lift) / (H.off - H.lift));
      if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = l; }
      return out.copy(b.wallP).lerp(b.wallOut, l * l);
    }
    if (u > H.back) {
      const l = 1 - ease((u - H.back) / (H.down - H.back));
      if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = 0.15 * l; }
      return out.copy(b.wallP).lerp(b.wallOut, l * l);
    }
    if (st) {
      st.wall = Math.max(1 - smoothstep(H.off, H.off + 0.014, u), smoothstep(H.back - 0.014, H.back, u));
      st.hold = Math.max(smoothstep(0.776, H.kiss0, u) * (1 - smoothstep(H.kiss1, H.kiss1 + 0.016, u)), smoothstep(H.kiss2 - 0.014, H.kiss2, u) * (1 - smoothstep(H.kiss3, H.kiss3 + 0.012, u)));
      st.lift = 1; st.ghost = 1 - 0.85 * smoothstep(0.89, H.back, u); st.face = b.face;
    }
    return keyEval(b.keys, u, out);
  }
  for (const fl of pair.flights) {
    if (fl.per) {
      // a bird of a loose flock: lift, fly its keys, lie down
      const f = fl.per[b.role];
      if (u <= f.uA || u >= f.uD) continue;
      if (u < f.uOff) {
        const l = ease((u - f.uA) / (f.uOff - f.uA));
        if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = l; }
        return out.copy(b.wallP).lerp(b.wallOut, l * l);
      }
      if (u > f.uBack) {
        const l = 1 - ease((u - f.uBack) / (f.uD - f.uBack));
        if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = 0.15 * l; }
        return out.copy(b.wallP).lerp(b.wallOut, l * l);
      }
      if (st) {
        st.wall = Math.max(1 - smoothstep(f.uOff, f.uOff + 0.014, u), smoothstep(f.uBack - 0.014, f.uBack, u));
        st.hold = 0; st.lift = 1; st.ghost = 1 - 0.85 * smoothstep(f.uBack - 0.035, f.uBack, u); st.face = null;
      }
      return keyEval(f.keys, u, out);
    }
    if (u <= fl.u0 || u >= fl.u1 || !fl.curves) continue;
    const phi = (u - fl.u0) / (fl.u1 - fl.u0), [pe, po, ph, pb] = fl.ph, cv = fl.curves[b.role];
    if (phi < pe) {
      const l = ease(phi / pe);
      if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = l; }
      return out.copy(b.wallP).lerp(b.wallOut, l * l);
    }
    if (phi > pb) {
      const l = 1 - ease((phi - pb) / (1 - pb));
      if (st) { st.wall = 1; st.hold = 0; st.lift = l; st.ghost = 0.15 * l; }
      return out.copy(b.wallP).lerp(b.wallOut, l * l);
    }
    if (st) {
      st.wall = Math.max(1 - smoothstep(pe, pe + 0.07, phi), smoothstep(pb - 0.07, pb, phi));
      st.hold = smoothstep(po - 0.08, po - 0.01, phi) * (1 - smoothstep(ph + 0.01, ph + 0.07, phi));
      st.lift = 1; st.ghost = 1 - 0.85 * smoothstep(ph + 0.1, pb, phi); st.face = cv.face;
    }
    if (phi < po) { const t = (phi - pe) / (po - pe); return crEval(cv.out, 1 - (1 - t) * (1 - t), out); }
    if (phi < ph) return out.copy(cv.seat);
    return crEval(cv.back, ease((phi - ph) / (pb - ph)), out);
  }
  if (st) { st.wall = 1; st.hold = 0; st.lift = 0; st.ghost = 0; }
  return out.copy(b.wallP);
}
const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _n = new THREE.Vector3(), _l = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
// full pose of bird b written into the instance arrays at index b.i
function poseBird(flock, b, u, time, cam, rareW, rareP, M, S, G) {
  const pair = flock.pairs[b.pair];
  birdPos(b, pair, u, _p, ST);
  let wall = ST.wall, hold = ST.hold, lift = ST.lift, ghost = ST.ghost;
  const face = ST.face;
  if (wall < 1) {
    birdPos(b, pair, u + 0.003, _a); birdPos(b, pair, u - 0.003, _b);
    _a.sub(_b);
    if (_a.lengthSq() > 0.02) b.pf.copy(_a.normalize());
  }
  _f.copy(b.pf);
  if (hold > 0 && face) _f.lerp(face, hold).normalize();
  // parted after the kiss, the seventh pair sails beside the window beak outward, its whole painted shape toward the eye
  const part = b.hero ? smoothstep(0.822, 0.842, u) * (1 - smoothstep(0.884, 0.9, u)) : 0;
  if (part > 0) { _f.lerp(b.face2, 0.92 * part); if (_f.lengthSq() < 1e-4) _f.copy(b.face2); _f.normalize(); }
  const fin = b.fin && u > b.fin.uOff ? smoothstep(b.fin.uOff + 0.015, b.fin.uOff + 0.045, u) : 0;
  if (rareW > 0) {
    // one flock: a tilted ring over the bed, its near side high, every bird at its own place along it
    const tr = TIERS[b.tier || 0], th = TAU * (b.ring + (0.7 + 0.22 * (b.tier || 0)) * rareP) + time * 0.1;
    const cs = Math.cos(th), sn = Math.sin(th);
    // (the wheel draws back to the west and closes a little as the eye comes round the corner toward it)
    const away = smoothstep(0.5, 0.56, u);
    _t.set(RING.x - 7 * away + RING.rx * tr[0] * cs, RING.y + tr[1] + RING.tilt * tr[0] * cs + 0.6 * Math.sin(2 * th + b.seed * 9), RING.z + (RING.rz - 4 * away) * tr[0] * sn);
    _p.lerp(_t, rareW);
    _t.set(-RING.rx * sn, -RING.tilt * sn, RING.rz * cs).normalize();
    _f.lerp(_t, rareW);
    if (_f.lengthSq() < 1e-4) _f.copy(_t);
    _f.normalize();
    wall *= 1 - rareW; hold *= 1 - rareW; lift = Math.max(lift, rareW); ghost = Math.max(ghost, rareW);
  }
  const air = 1 - wall;
  const k = b.i * 16;
  const [gs] = gustAt(b.s, time);
  let flap;
  const fw = lift * 0.8 + 0.16 * Math.max(0, gs) * Math.sin(time * 27 + b.seed * 60);
  if (air <= 0) {
    _f.copy(b.wf); _l.copy(b.wl); _n.copy(b.wn); flap = fw;
  } else {
    // the flat mark turns its face to the eye as far as its heading allows
    _t.copy(cam).sub(_p);
    if (fin > 0) {
      // (a leaving bird is drawn whole: what there is of its heading along the line of sight is taken out, so that it lies
      // in the picture plane and points where it is going in the picture, toward the window, like the birds on the wall)
      const tl = Math.max(_t.length(), 1e-3), c = _f.dot(_t) / tl, upc = _t.y / tl;
      _q.copy(_f).addScaledVector(_t, (-0.88 * fin * c) / tl);
      _q.y += 0.35 * fin * Math.abs(c); _q.addScaledVector(_t, (-0.35 * fin * Math.abs(c) * upc) / tl);
      if (_q.lengthSq() > 1e-4) _f.copy(_q).normalize();
    }
    _n.copy(_t).addScaledVector(_f, -_t.dot(_f));
    _q.copy(UP).addScaledVector(_f, -_f.y);
    if (_q.lengthSq() < 1e-4) _q.set(1, 0, 0).addScaledVector(_f, -_f.x);
    _q.normalize();
    if (_n.lengthSq() < 1e-4) _n.copy(_q); else _n.normalize();
    _n.multiplyScalar(0.82).addScaledVector(_q, 0.18);
    _n.addScaledVector(_f, -_n.dot(_f)).normalize();
    _l.crossVectors(_n, _f);
    if (_l.y * b.sgn < -0.25) b.sgn = -b.sgn;
    _l.multiplyScalar(b.sgn);
    if (wall > 0) {
      _f.lerp(b.wf, wall); if (_f.lengthSq() < 1e-4) _f.copy(b.wf); _f.normalize();
      _l.lerp(b.wl, wall); _l.addScaledVector(_f, -_l.dot(_f));
      if (_l.lengthSq() < 1e-4) _l.copy(b.wl); _l.normalize();
      _q.copy(_n).lerp(b.wn, wall);
      _n.crossVectors(_f, _l); if (_n.dot(_q) < 0) _n.negate();
    }
    const glide = smoothstep(0.2, 0.8, Math.sin(time * 0.8 + b.seed * 30));
    const ff = 0.2 + 0.62 * Math.sin(time * (9.5 + 3 * b.seed) + b.seed * 50) * (1 - 0.5 * glide);
    const fh = 0.5 + 0.32 * Math.sin(time * 12 + b.seed * 50);
    flap = lerp(lerp(ff, fh, hold), fw, wall);
    const bob = air * (1 - 0.6 * hold);
    _p.x += Math.sin(time * 1.3 + b.seed * 20) * 0.5 * bob; _p.y += Math.sin(time * 1.9 + b.seed * 33) * 0.4 * bob; _p.z += Math.cos(time * 1.1 + b.seed * 11) * 0.5 * bob;
    // keep the flat marks clear of the eye: a bird within 9 m of the camera slides out along the line from it
    _t.copy(_p).sub(cam);
    const dc = _t.length();
    // (no flat mark is ever nearer than the kissing pair: 15 m, 21 m while the whole colony wheels, 14 m in the leaving)
    const keep = fin > 0 ? 14 : 15 + 6 * smoothstep(0, 0.3, rareW);
    if (dc < keep && !b.hero) {
      if (dc < 0.05) _t.set(0, 1, 0); else _t.multiplyScalar(1 / dc);
      _p.addScaledVector(_t, (keep - dc) * air);
    }
  }
  // (out over the sea a bird is soon a speck and then nothing: beyond the portal's plane it dwindles away)
  const sc = fin > 0 || (b.hero && u > 0.95) ? 1 - smoothstep(WIN.xo + 3, WIN.xo + 20, _p.x) : 1;
  M[k] = _f.x * sc; M[k + 1] = _f.y * sc; M[k + 2] = _f.z * sc; M[k + 3] = 0;
  M[k + 4] = _l.x * sc; M[k + 5] = _l.y * sc; M[k + 6] = _l.z * sc; M[k + 7] = 0;
  M[k + 8] = _n.x * sc; M[k + 9] = _n.y * sc; M[k + 10] = _n.z * sc; M[k + 11] = 0;
  M[k + 12] = _p.x; M[k + 13] = _p.y; M[k + 14] = _p.z; M[k + 15] = 1;
  S[b.i * 4] = flap; S[b.i * 4 + 1] = air; S[b.i * 4 + 2] = b.seed; S[b.i * 4 + 3] = 1;
  G[b.i * 4 + 3] = clamp(ghost, 0, 1) * 0.9;
  POSE.air = air; POSE.hold = hold;
}

// the brief's route in hero-local coordinates: one low lap, the higher half lap, the half turn, the straight
export function buildFlyThrough(heightKeys) {
  const segs = [];   // { len, at(t) -> [x, z] }
  const line = (x0, z0, x1, z1) => segs.push({ len: Math.hypot(x1 - x0, z1 - z0), at: (t) => [lerp(x0, x1, t), lerp(z0, z1, t)] });
  const arc = (cx, cz, r, a0, a1) => segs.push({ len: Math.abs(a1 - a0) * r, at: (t) => { const a = lerp(a0, a1, t); return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; } });
  const H = Math.PI / 2;
  line(48, 29.5, -22, 29.5); arc(-22, 14.5, 15, H, 2 * H);          // west along the south wall, SW corner
  line(-37, 14.5, -37, -14.5); arc(-22, -14.5, 15, 2 * H, 3 * H);   // north along the west wall, NW corner
  // the east leg runs 30 m from the window wall (not the brief's 13), so that the whole stone window, the portal in it
  // and the painted wall round it are in one view as we pass
  const XE = 20;
  line(-22, -29.5, XE - 15, -29.5); arc(XE - 15, -14.5, 15, 3 * H, 4 * H);   // east along the north wall, NE corner
  line(XE, -14.5, XE, 14.5); arc(XE - 15, 14.5, 15, 0, H);                   // south past the window, SE corner
  line(XE - 15, 29.5, -24, 29.5); arc(-24, 14.5, 15, H, 3 * H);              // west again, the half turn over the bed
  line(-24, -0.5, 64, -0.5);                                        // straight out of the window
  const total = segs.reduce((a, s) => a + s.len, 0);
  // heightKeys: optional [[distance, y], ...] for the stretch before the last straight (the world may lift the window pass)
  const keys = (heightKeys || [[0, 7], [146, 7], [180, 13], [228, 24], [262, 29], [296, 36]]).concat([[total - 88, 40], [total, 40]]);
  const yAt = (d) => { let i = 0; while (i < keys.length - 2 && d > keys[i + 1][0]) i++; return lerp(keys[i][1], keys[i + 1][1], ease((d - keys[i][0]) / (keys[i + 1][0] - keys[i][0]))); };
  const pts = [];
  let d0 = 0;
  for (const s of segs) {
    const n = Math.max(1, Math.round(s.len / 7.8));
    for (let i = 0; i < n; i++) { const t = i / n, [x, z] = s.at(t); pts.push([x, yAt(d0 + s.len * t), z]); }
    d0 += s.len;
  }
  pts.push([64, 40, -0.5]);
  return pts;
}

// ---------------------------------------------------------------- the hero
const VIEW = 'kiss';   // what the set-piece viewer orbits: 'kiss' (shipped) | 'crag' | 'sun' (development only)

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const vary = ctx.vary || {};
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  // ---- the look of this visit
  const r0 = rng(), r1 = rng(), r2 = rng(), r3 = rng();
  const look = opts.look || (vary.hour === 'day' ? 'noon' : r0 < 0.5 ? 'spring' : r0 < 0.75 ? 'unfinished' : 'noon');
  const castName = opts.cast || (look === 'noon' ? 'blue' : r1 < 0.4 ? 'red' : r1 < 0.7 ? 'yellow' : 'blue');
  const lily = opts.lily || (look === 'noon' ? 'papyrus' : r2 < 0.62 ? 'red' : 'white');
  const V = { look, lead: castName === 'red' ? 1 : castName === 'yellow' ? 2 : 3, lily, bands: r3 < 0.6 ? 3 : 2, rare: opts.rare ?? !!vary.rare };
  const density = clamp(opts.density ?? vary.density ?? 1, 0.7, 1.3);

  // ---- shared uniforms
  // the one lighter step inside the sun shape: brighter and WARMER (never chalkier: a paler patch reads as a pane of
  // glass laid on the painting, a golden one as sunlight). opts.sunPlaster overrides the sunlit plaster tone.
  const night = vary.hour === 'night';
  const sunPl = new THREE.Color(opts.sunPlaster || (night ? opts.palette?.[1] || DEFAULT_PALETTE[1] : '#FFF2C6'));
  const warm = night ? new THREE.Color(1, 1, 1) : new THREE.Color(1.06, 1.0, 0.8);
  const sunMix = (c) => c.clone().multiplyScalar(1.26).multiply(warm).lerp(sunPl, 0.02);
  const pig = [pal[0], pal[2], pal[3], pal[4], pal[5]];
  const sun0 = look === 'noon' ? { az: 62, el: 58 } : { az: SPRING_SUN.az, el: SPRING_SUN.el };
  const U = {
    uTime: { value: 0 }, uGustT: { value: 0 }, uU: { value: 0 },
    uSunDir: { value: new THREE.Vector3(1, 0.4, 0.6).normalize() },
    uWinIn: { value: new THREE.Vector4(WIN.x, WIN.z, WIN.y, 0) }, uWinOut: { value: new THREE.Vector4(WIN.xo, WIN.z, WIN.y, 0) },
    uWinHalf: { value: new THREE.Vector4(WIN.hw, WIN.hh, 60, 60) },
    uPlaster: { value: pal[0] }, uPlasterSun: { value: sunPl },
    uPig: { value: pig }, uPigSun: { value: [sunPl, sunMix(pal[2]), sunMix(pal[3]), sunMix(pal[4]), sunMix(pal[5])] },
  };
  const setSun = (az, el) => {
    const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
    U.uSunDir.value.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a));
  };
  setSun(sun0.az, sun0.el);
  const shared = { uTime: U.uTime, uGustT: U.uGustT, uSunDir: U.uSunDir, uWinIn: U.uWinIn, uWinOut: U.uWinOut, uWinHalf: U.uWinHalf, uPig: U.uPig, uPigSun: U.uPigSun };
  const fogU = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group();
  object.name = 'room-of-swallows-hero';
  await ctx.yield();

  // ---- the painting
  const crags = await layoutCrags(ctx, rng.fork('crags'), V);
  await ctx.yield();
  const maxAniso = Math.min(8, ctx.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  const tex = await paintStrip(ctx, crags.lobes.filter((l) => !l.east), maxAniso);
  await ctx.yield();
  const texE = await paintStrip(ctx, crags.lobes.filter((l) => l.east), maxAniso, TEX_WE, SE0);
  await ctx.yield();
  const wallU = {
    ...shared, ...fogU, tFill: { value: tex.tFill }, tLine: { value: tex.tLine }, tAux: { value: tex.tAux },
    uStrip: { value: new THREE.Vector2(0, SLEN) },
    uPlaster: U.uPlaster, uPlasterSun: U.uPlasterSun, uFloodS: { value: look === 'unfinished' ? 128 : 400 },
    uUnfinished: { value: look === 'unfinished' ? 1 : 0 }, uCrackEnd: { value: 222 }, uBands: { value: V.bands },
  };
  const wallMat = new THREE.ShaderMaterial({ uniforms: wallU, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true });
  const walls = new THREE.Mesh(buildWallGeometry(), wallMat);
  walls.name = 'painted-walls';
  object.add(walls);
  // the east wall: the same shader (one program) reading its own canvases; every other uniform is the same object
  const eastU = { ...wallU, tFill: { value: texE.tFill }, tLine: { value: texE.tLine }, tAux: { value: texE.tAux }, uStrip: { value: new THREE.Vector2(SE0, TEX_WE / PPM) } };
  const eastMat = new THREE.ShaderMaterial({ uniforms: eastU, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true });
  const eastWall = new THREE.Mesh(buildEastGeometry(), eastMat);
  eastWall.name = 'painted-east-wall';
  object.add(eastWall);
  await ctx.yield();

  // ---- lilies
  const lrng = rng.fork('lilies');
  const clumps = Math.round(160 * Math.max(0.7, detail) * density);
  const roots = crags.roots.map((r) => (r.s > 242 && r.s < 273 ? { ...r, cap: 17 } : r));
  const lilyMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, ...fogU, uU: U.uU, uFloodS: wallU.uFloodS, uUnfinished: wallU.uUnfinished, uPetal: { value: lily === 'red' ? 1 : lily === 'white' ? 0 : 3 }, uStamen: { value: 2 }, uOutline: { value: lily === 'white' ? 1 : 0 } },
    vertexShader: LILY_VERT, fragmentShader: LILY_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const setA = lilyInstances(lrng, roots, clumps);
  // the lilies of the second pass: on the low rocks that close the gaps, and short stiff ones on the east wall
  const xr = lrng.fork('more');
  const gapRoots = crags.extraRoots.filter((r) => !r.east), eastRoots = crags.extraRoots.filter((r) => r.east);
  const sets = [setA];
  const dk = Math.max(0.7, detail) * density;
  if (gapRoots.length) sets.push(lilyInstances(xr, gapRoots, Math.min(gapRoots.length, Math.round(46 * dk))));
  if (eastRoots.length) sets.push(lilyInstances(xr, eastRoots, Math.min(eastRoots.length, Math.round(30 * dk))));
  // (round four) a spray of lilies painted up both stone jambs of the window: five clumps of three a side, rooted at the
  // sill, the tallest in the middle (strip s 410.. is the north jamb, 460.. the south jamb, metres out from the room face; a
  // leaf that would pass either end of a jamb is pressed flat against that end, so nothing spans the opening)
  {
    const jr = xr.fork('jamb'), n = 30, iRoot = new Float32Array(n * 4), iMisc = new Float32Array(n * 4);
    let k = 0;
    for (let sd2 = 0; sd2 < 2; sd2++) for (let c = 0; c < 5; c++) {
      const t = 1.8 + c * 2.7 + jr.range(-0.5, 0.5), baseL = jr.range(8.5, 13.5) + (c === 2 ? 4 : c === 1 || c === 3 ? 2 : 0);
      for (let j = 0; j < 3; j++) {
        const sd = j - 1;
        iRoot[k * 4] = 410 + sd2 * 50 + t + sd * 0.4; iRoot[k * 4 + 1] = 28.12;
        iRoot[k * 4 + 2] = Math.min(baseL * (sd === 0 ? 1.08 : jr.range(0.7, 0.95)), 19.5); iRoot[k * 4 + 3] = sd * jr.range(0.14, 0.26) + jr.range(-0.05, 0.05);
        iMisc[k * 4] = jr(); iMisc[k * 4 + 1] = -1; iMisc[k * 4 + 2] = jr.range(0.95, 1.25); iMisc[k * 4 + 3] = 0.12 + 0.012 * (k % 16);
        k++;
      }
    }
    sets.push({ iRoot, iMisc, n });
  }
  const lilies = lilyMesh(sets, buildLilyGeometry(lily), lilyMat);
  lilies.name = 'lilies';
  object.add(lilies);
  await ctx.yield();

  // ---- swallows and their ghosts
  const flock = makeFlock(rng.fork('swallows'));
  const NB = flock.birds.length;
  const sg = buildSwallowGeometry();
  const mkBirdGeo = () => {
    const g = new THREE.InstancedBufferGeometry();
    g.index = sg.index;
    for (const name of ['position', 'aPig', 'aAnim']) g.setAttribute(name, sg.getAttribute(name));
    g.instanceCount = NB;
    return g;
  };
  const birdM = new Float32Array(NB * 16), birdS = new Float32Array(NB * 4);
  const ghostM = new Float32Array(NB * 16), ghostS = new Float32Array(NB * 4);
  const birdGeo = mkBirdGeo(), ghostGeo = mkBirdGeo();
  const aBirdM = new THREE.InstancedBufferAttribute(birdM, 16), aBirdS = new THREE.InstancedBufferAttribute(birdS, 4);
  const aGhostS = new THREE.InstancedBufferAttribute(ghostS, 4);
  aBirdM.setUsage(THREE.DynamicDrawUsage); aBirdS.setUsage(THREE.DynamicDrawUsage); aGhostS.setUsage(THREE.DynamicDrawUsage);
  birdGeo.setAttribute('iMat', aBirdM); birdGeo.setAttribute('iState', aBirdS);
  for (const b of flock.birds) {
    const k = b.i * 16, p = stripToRoom(b.s, b.y, 0.06, _a);
    ghostM.set([b.wf.x, b.wf.y, b.wf.z, 0, b.wl.x, b.wl.y, b.wl.z, 0, b.wn.x, b.wn.y, b.wn.z, 0, p.x, p.y, p.z, 1], k);
    ghostS[b.i * 4 + 2] = b.seed;
  }
  ghostGeo.setAttribute('iMat', new THREE.InstancedBufferAttribute(ghostM, 16)); ghostGeo.setAttribute('iState', aGhostS);
  const birdUni = (ghost) => ({ ...shared, ...fogU, uGhost: { value: ghost }, uGhostCol: { value: pal[1].clone() }, uGhostSun: { value: pal[1].clone().lerp(pal[0], 0.75) }, uGhostLine: { value: pal[0].clone().multiplyScalar(0.83) } });
  // plain instanced Meshes: the instance matrix is our own attribute iMat
  const birdVert = BIRD_VERT.replace('attribute float aPig;', 'attribute mat4 iMat;\nattribute float aPig;');
  // (the birds are opaque, but are drawn with the transparent things, after the world's shaft of light, so that no veil
  // of light is ever laid over a flying bird: its black line stays black)
  const birdMat = new THREE.ShaderMaterial({ uniforms: birdUni(0), vertexShader: birdVert, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide, transparent: true });
  const ghostMat = new THREE.ShaderMaterial({ uniforms: birdUni(1), vertexShader: birdVert, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const ghosts = new THREE.Mesh(ghostGeo, ghostMat); ghosts.frustumCulled = false; ghosts.renderOrder = 1; ghosts.name = 'ghosts';
  const birds = new THREE.Mesh(birdGeo, birdMat); birds.frustumCulled = false; birds.renderOrder = 3; birds.name = 'swallows';
  object.add(ghosts, birds);
  await ctx.yield();

  // ---- route, anchors
  const flyThrough = buildFlyThrough();
  let path = opts.path || makePath(flyThrough);
  flock.defer = true;
  flock.setPath(path);
  await ctx.yield();
  flock.leave();
  flock.defer = false;
  await ctx.yield();
  const taught = flock.pairs.filter((p) => p.taught).map((p) => ({ u0: p.flights[0].u0, u1: p.flights[0].u1, uMeet: p.flights[0].uMeet, meet: p.flights[0].meet.clone() }));
  const sunShape = new THREE.Vector3(WIN.x - (WIN.z + RZ) / Math.tan((sun0.az * Math.PI) / 180), WIN.y - ((WIN.z + RZ) / Math.sin((sun0.az * Math.PI) / 180)) * Math.tan((sun0.el * Math.PI) / 180), -RZ);
  const anchors = {
    flyThrough,
    portalSeat: { position: new THREE.Vector3(64, 40, -0.5), normal: new THREE.Vector3(-1, 0, 0), radius: 8 },
    window: { center: new THREE.Vector3(WIN.x, WIN.y, WIN.z), width: 18, height: 24, sill: 28, depth: 15 },
    kiss: { position: flock.kiss, u0: HERO_U.kiss0, u1: HERO_U.kiss1, facing: flock.kissFwd },
    heroNest: flock.pairs[0].birds.map((b) => b.wallP.clone()),
    pairs: taught,
    crag: new THREE.Vector3(-RX, 33.5, 29.5),
    entry: new THREE.Vector3(48, 7, 29.5),
    sunShape,
    viewpoints: {
      entry: new THREE.Vector3(48, 7, 29.5), closePass: new THREE.Vector3(-37, 7, 2), sun: new THREE.Vector3(2, 8.5, -29.5),
      window: new THREE.Vector3(37, 21, 4), kissEye: new THREE.Vector3(-24, 40, -0.5),
    },
    pace: [[0, 1.13], [0.66, 1.13], [0.72, 0.45], [0.83, 0.45], [0.9, 1], [1, 1]],
    leaving: { u0: FIN.off0, u1: 0.96, kiss2: [HERO_U.kiss2, HERO_U.kiss3] },
  };

  // ---- animation
  let progress = -1, kiss = 0, airCount = 0;
  const demo = opts.demo !== false;
  const camL = new THREE.Vector3(60, 30, 0);
  const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);
  function update(dt, time, camera) {
    const u = progress >= 0 ? progress : demo ? 0.65 + 0.31 * (((time / 24) % 1 + 1) % 1) : 0;
    U.uTime.value = time; U.uGustT.value = time; U.uU.value = u;
    const creep = tri(time / 55) * 55;
    setSun(sun0.az + 0.135 * creep, sun0.el + 0.04 * creep);
    // the unfinished wall: a pure function of u. The colour has reached the red crag on the entry axis before we come
    // in and waits there; on the close pass its front runs north FLOOD_LEAD metres ahead of the eye, so the near wall is
    // in full colour, the far wall still red sketch and string lines, and the edge between them is always in the frame.
    if (look === 'unfinished') {
      let fs = 131;
      if (u > 0.13) { path.pointAt(Math.min(u, 0.3), _a); fs = Math.max(131, 142.5 - _a.z + FLOOD_LEAD); }
      wallU.uFloodS.value = lerp(fs, 197, smoothstep(0.3, 0.335, u));
    }
    let rareW = 0, rareP = 0;
    if (V.rare) {
      rareW = smoothstep(0.445, 0.47, u) * (1 - smoothstep(0.553, 0.578, u));
      rareP = (u - 0.445) / 0.13;
      wallU.uCrackEnd.value = 222 + 14 * smoothstep(0.45, 0.5, u);
    }
    if (camera) { camera.getWorldPosition(camL); object.worldToLocal(camL); }
    let air = 0;
    for (let i = 0; i < NB; i++) {
      const b = flock.birds[i];
      poseBird(flock, b, u, time, camL, rareW, rareP, birdM, birdS, ghostS);
      if (POSE.air > 0.5) air++;
      if (b.hero && b.role === 0) kiss = POSE.hold;
    }
    airCount = air;
    aBirdM.needsUpdate = true; aBirdS.needsUpdate = true; aGhostS.needsUpdate = true;
  }
  update(0, 0, null);

  const kp = flock.kiss;
  const view = VIEW === 'crag' ? { center: new THREE.Vector3(-RX, 16, 29.5), radius: 4.5, height: 10 }
    : VIEW === 'sun' ? { center: new THREE.Vector3(-8, 14, -RZ), radius: 5.5, height: 8 }
    : VIEW === 'entry' ? { center: new THREE.Vector3(-RX, 22, 29.5), radius: 26, height: 2 }
    : { center: kp.clone(), radius: 8, height: 10 };
  return {
    object, radius: view.radius, height: view.height, center: view.center,
    size: new THREE.Vector3(2 * RX, RH, 2 * RZ),
    anchors, uniforms: U, glsl: { sun: GLSL_SUN, gust: GLSL_GUST, pigment: GLSL_PIG, strip: GLSL_STRIP, hash: GLSL_HASH, crack: GLSL_CRACK },
    look: V, stripToRoom: (s, y, off = 0, out = new THREE.Vector3()) => stripToRoom(s, y, off, out), gustAt,
    setProgress(u) { progress = clamp(u, 0, 1); },
    setPath(p) { path = p; flock.setPath(p); },
    // midpoint of the seventh pair at progress u (a pure function of u: for the world's gaze)
    // a point of the leaving ribbon, `back` metres behind its leading bird, at progress u (for the world's gaze)
    ribbonAt(u, back, out = new THREE.Vector3()) { return flock.finCourse(Math.min(flock.finHead(u) - back, flock.finTotal - 1), out); },
    pairAt(u, out = new THREE.Vector3()) { const pr = flock.pairs[0]; birdPos(pr.birds[0], pr, u, out); birdPos(pr.birds[1], pr, u, _q); return out.add(_q).multiplyScalar(0.5); },
    // centre of the sun shape on the north wall right now (y below the floor: the sun is too steep to reach the wall)
    sunShapeAt(out = new THREE.Vector3()) { const d = U.uSunDir.value, t = (WIN.z + RZ) / Math.max(d.z, 0.05); return out.set(WIN.x - d.x * t, WIN.y - d.y * t, -RZ); },
    sun0,
    get kiss() { return kiss; }, get air() { return airCount; },
    update, dispose() {},
    ground: true, groundY: 0,
  };
}
