// FIGURE AND GROUND: hero set piece. The tessellation plane and the moment of crossing it.
//
// WHAT IT IS
//   A woodcut printed in ink, paper and one accent. One horizontal plane at local y = 0 is tiled by
//   8 x 5 m rhombi whose edges are bent into creatures: ivory fish (side view, nose toward +X) and
//   the black gaps between them, which are geese seen from above (bill toward +X). Under the plane a
//   locking front sweeps along +X: fish rise out of the black, fall into files, roll a quarter turn
//   and click into their cells, so the ceiling lays itself. Over the plane straight lift-off fronts
//   30 degrees off +X cross it at 40 m/s: along each one the geese swell out of their cells, beat
//   and climb away in chevrons, and the cells they leave turn from solid to hatched black.
//   The exit annulus (a circle-limit ring of the same tiling, log-polar mapped) stands at +X.
//
// EXACTNESS: one table of four edge curves (16 segments each) feeds everything: the fish mesh, the
//   goose mesh (same curves in the order C, D, A, B), the signed-distance texture the plane draws
//   from, and the portal ring. A cell is drawn by the plane OR by an instance, never both.
//
// STYLE (how the print look is done, for the world coder to match):
//   Every material is an unlit ShaderMaterial that computes a TONE (0 ink .. 1 paper) from signed
//   distances and stripe functions, blends tones (never colours), then thresholds once with a
//   one-pixel smoothstep (width from fwidth) into mix(ink, paper), plus an accent mask. So every
//   pixel is ink, paper or accent with one pixel of antialiasing. Tone is carried by line WIDTH of
//   parallel hatching; depth is hatch density (far creatures are drawn as fewer, thinner lines and
//   the rest is discarded). Key outline 4.5 cm, never thinner than ~1 px. No lights are read.
//   hero.glsl (string) holds the shared GLSL (fishTone, gooseTone, cell lookup), hero.sdfTexture the
//   8 x 5 m periodic signed-distance tile, hero.outline = { fish, goose } the Vector2 outlines
//   (x, z) for building mounts in the same cut.
//
// SIZE: plane disc of opts.planeRadius (default 2600 m). Action window about 170 x 180 m that follows
//   the camera. radius 60, height 40 are viewer framing only. ground: false (it is its own ground).
// COST: about 125k triangles (fish 92 x 704, geese 81 x 720, ring geese, plane, ring), 5 draw calls,
//   one 320 x 200 half-float texture, build ~80 ms. No lights. Expects NO lighting; wants a flat
//   paper sky above and flat ink below; scene fog is supported (fog chunks) and scaled by opts.fog.
//
// OPTS: palette [ink, paper, accent, paperMottle, inkSheen]; edition 'day' | 'night' (blocks
//   swapped) | 'golden' (kraft paper); accent hex override (default: by seed vermilion / Prussian
//   blue / gold); fishCols (16), fishRows (44), gooseCols (20), gooseRows (36); planeRadius;
//   portalDistance (150; the brief's world wants about 430); fog 0..1 (1); demo (true: the locking
//   front loops by itself until setLockFront() is first called).
//
// PROGRESS HOOKS (all local space, call every frame from the world's update with values from u):
//   setLockFront(x)     cells with centre x < this are laid. Sweep it ahead of the camera during the
//                       climb; pass 1e6 once above the plane (complete to the horizon).
//   setFrontPhase(m)    extra metres added to the lift-off fronts' travel, to place a front exactly.
//   setHole(x, z)       goose cell that the plane leaves open as the real hole for the crossing
//                       (default anchors.crossingGoose; pass (1e9, 0) for none).
//   setRedFish(x, z)    fish cell printed with the accent dorsal fin and eye (default crossingFish).
//   setRedOpen(bool)    true: the accent fish cell stays empty (the world's own mount fish will fill it).
//   setFrontSpacing(m)  metres between lift-off fronts (more fronts at once when smaller).
//   setRiseLimit(x)     geese in cells past this x beat on the plane but do not climb away (keeps the air in front of
//                       the portal clear). opts.gooseBack: metres the geese window is shifted back from the gaze point.
//   setPortalProgress(v) 0..1: the ring's innermost birds unlock one by one and fly through.
//   Ambient motion (swimming, front travel, ring turning 3 deg/s) runs on `time`.
//
// ANCHORS (local space; +X is the direction of travel):
//   crossingFish   centre of the fish cell our fish locks into (accent fin).
//   crossingGoose  centre of the goose cell beside it: the hole the camera rises through.
//   crossingDir    unit direction of a 20 degree upward crossing.
//   flyThrough     ordered points: under the plane, up through the hole, low over the plane, to the
//                  portal centre. Nothing solid within 6 m except the plane itself at the hole.
//   portalSeat     { position, facing }: centre of the 14 m opening and the direction the portal
//                  should face (back along the path, -X). portalRing is the Object3D to move if the
//                  world puts the portal elsewhere (call hero.placePortal(x, y, z)).
//   viewBelow / viewAbove / viewPortal   camera viewpoints for the brief's key frames.
//   frontDir       unit XZ normal of the lift-off fronts; frontSpeed, frontSpacing in m/s and m.
import * as THREE from 'three';

const DEF_PALETTE = ['#0E0C0A', '#EFE6D2', '#D9381E', '#E3D8BF', '#1D1916'];
const CELL_X = 8, CELL_Z = 5, SEG = 16;

// ---------- the edge table ----------
// Each curve runs corner to corner of the rhombus W(-4,0) N(0,2.5) E(4,0) S(0,-2.5) and is a straight
// edge plus gaussian bumps along the outward normal (positive = out of the fish).
function makeEdgeTable(rng) {
  const j = () => rng.range(0.74, 1.26);
  const v = rng.range(-0.03, 0.03);
  const bumps = {
    A: [[0.09, 0.30 * j(), 0.07], [0.31 + v, -0.46 * j(), 0.13], [0.66 + v, 0.56 * j(), 0.14]],   // W -> N: tail lobe, peduncle, dorsal hump
    B: [[0.13, -0.34 * j(), 0.08], [0.52 + v, 0.40 * j(), 0.20]],                                  // N -> E: notch, forehead
    C: [[0.48 - v, 0.38 * j(), 0.20], [0.87, -0.32 * j(), 0.08]],                                  // E -> S: jaw, notch
    D: [[0.34 - v, 0.54 * j(), 0.14], [0.69 - v, -0.46 * j(), 0.13], [0.91, 0.30 * j(), 0.07]],   // S -> W: belly, peduncle, tail lobe
  };
  const corners = { W: [-4, 0], N: [0, 2.5], E: [4, 0], S: [0, -2.5] };
  const ends = { A: ['W', 'N'], B: ['N', 'E'], C: ['E', 'S'], D: ['S', 'W'] };
  const table = {};
  for (const k of 'ABCD') {
    const p = corners[ends[k][0]], q = corners[ends[k][1]];
    const dx = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len;
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      let off = 0;
      for (const [c, a, s] of bumps[k]) off += a * Math.exp(-0.5 * ((t - c) / s) ** 2);
      const w = Math.min(1, t / 0.07) * Math.min(1, (1 - t) / 0.07);
      off *= w * w * (3 - 2 * w);
      pts.push([p[0] + dx * t + nx * off, p[1] + dz * t + nz * off]);
    }
    table[k] = pts;
  }
  return table;
}

// fish: A, B, C, D in order. goose: the complementary cell, the same curves as C, D, A, B.
function makeOutlines(table) {
  const fish = [], goose = [];
  for (const k of 'ABCD') for (let i = 0; i < SEG; i++) fish.push(new THREE.Vector2(table[k][i][0], table[k][i][1]));
  const add = (k, ox, oz) => { for (let i = SEG; i > 0; i--) goose.push(new THREE.Vector2(table[k][i][0] + ox, table[k][i][1] + oz)); };
  add('C', -4, 2.5);   // W -> N
  add('D', 4, 2.5);    // N -> E
  add('A', 4, -2.5);   // E -> S
  add('B', -4, -2.5);  // S -> W
  return { fish, goose };
}

// flat mesh in the XZ plane from an outline; boundary vertices are the table positions exactly.
function outlineGeometry(outline) {
  const tris = THREE.ShapeUtils.triangulateShape(outline, []);
  const pos = new Float32Array(outline.length * 3);
  outline.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = p.y; });
  const idx = [];
  for (const t of tris) idx.push(t[0], t[1], t[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// fish sheet split along the spine with spine vertices, so the swimming wave bends it smoothly.
function fishGeometry(outline) {
  const pts = outline.slice(), n = outline.length, half = n / 2, spine = [];
  for (let k = 1; k < SEG; k++) { spine.push(pts.length); pts.push(new THREE.Vector2(4 - 8 * k / SEG, 0)); }
  const up = [], lo = [];
  for (let i = 0; i <= half; i++) up.push(i);
  up.push(...spine);
  for (let i = half; i < n; i++) lo.push(i);
  lo.push(0, ...spine.slice().reverse());
  return polysGeometry(pts, [up, lo]);
}
// goose sheet split at the two wing hinges (|z| = h), so each wing is a rigid flap.
function gooseGeometry(outline, h = 0.9) {
  const pts = [], n = outline.length;
  let crossings = 0;
  for (let i = 0; i < n; i++) {
    const a = outline[i], b = outline[(i + 1) % n];
    pts.push(a);
    for (const c of [h, -h]) if ((a.y - c) * (b.y - c) < 0) { const t = (c - a.y) / (b.y - a.y); pts.push(new THREE.Vector2(a.x + (b.x - a.x) * t, c)); crossings++; }
  }
  if (crossings !== 4) return outlineGeometry(outline);
  const top = [], bot = [], mid = [];
  pts.forEach((p, i) => { if (p.y >= h - 1e-9) top.push(i); if (p.y <= -h + 1e-9) bot.push(i); if (Math.abs(p.y) <= h + 1e-9) mid.push(i); });
  return polysGeometry(pts, [top, mid, bot]);
}
// a vertical side-profile sheet (neck, breast, tail) appended to the goose: collapsed while the goose
// is a flat cell, swelling as it lifts, so a goose seen edge-on still has a body.
function addKeel(geo) {
  const prof = [[3.9, 0], [3.0, 0.1], [2.1, 0.13], [1.1, 0.36], [-0.2, 0.42], [-1.6, 0.3], [-3.0, 0.1], [-3.9, 0],
    [-3.2, -0.14], [-2.2, -0.46], [-0.9, -0.86], [0.3, -0.9], [1.2, -0.52], [1.9, -0.2], [3.0, -0.13]].map((p) => new THREE.Vector2(p[0], p[1]));
  const op = geo.getAttribute('position').array, n0 = op.length / 3;
  const pos = new Float32Array(op.length + prof.length * 3);
  pos.set(op);
  prof.forEach((p, i) => { pos[(n0 + i) * 3] = p.x; pos[(n0 + i) * 3 + 1] = p.y; });
  const idx = Array.from(geo.index.array);
  for (const t of THREE.ShapeUtils.triangulateShape(prof, [])) idx.push(n0 + t[0], n0 + t[1], n0 + t[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
function polysGeometry(pts, polys) {
  const pos = new Float32Array(pts.length * 3), idx = [];
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 2] = p.y; });
  for (const poly of polys) for (const t of THREE.ShapeUtils.triangulateShape(poly.map((i) => pts[i]), [])) idx.push(poly[t[0]], poly[t[1]], poly[t[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// periodic signed distance (metres, positive inside the fish) over one 8 x 5 m period.
async function makeSdfTexture(fish, ctx, W = 320, H = 200) {
  const n = fish.length;
  const ax = new Float32Array(n), az = new Float32Array(n), bx = new Float32Array(n), bz = new Float32Array(n);
  const mx = new Float32Array(n), mz = new Float32Array(n), il = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = fish[i], b = fish[(i + 1) % n];
    ax[i] = a.x; az[i] = a.y; bx[i] = b.x - a.x; bz[i] = b.y - a.y;
    mx[i] = (a.x + b.x) / 2; mz[i] = (a.y + b.y) / 2; il[i] = 1 / Math.max(1e-9, bx[i] * bx[i] + bz[i] * bz[i]);
  }
  const data = new Uint16Array(W * H);
  for (let y = 0; y < H; y++) {
    if ((y & 3) === 0) await ctx.yield?.();
    const pz = ((y + 0.5) / H - 0.5) * CELL_Z;
    for (let x = 0; x < W; x++) {
      const px = ((x + 0.5) / W - 0.5) * CELL_X;
      let best = 1e9, inside = false;
      for (let i = 0; i < n; i++) {
        // nearest periodic image of this segment
        let ox = px - mx[i], oz = pz - mz[i];
        ox -= CELL_X * Math.round(ox / CELL_X); oz -= CELL_Z * Math.round(oz / CELL_Z);
        const qx = ox + mx[i] - ax[i], qz = oz + mz[i] - az[i];
        let t = (qx * bx[i] + qz * bz[i]) * il[i]; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = qx - bx[i] * t, ez = qz - bz[i] * t, d = ex * ex + ez * ez;
        if (d < best) best = d;
        // crossing test against the central fish
        const z0 = az[i], z1 = az[i] + bz[i];
        if ((z0 > pz) !== (z1 > pz) && px < ax[i] + bx[i] * (pz - z0) / (z1 - z0)) inside = !inside;
      }
      data[y * W + x] = THREE.DataUtils.toHalfFloat((inside ? 1 : -1) * Math.sqrt(best));
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------- shared GLSL: the cut ----------
// a slow 1 percent shear travelling through the plane: an in-plane displacement that is a function of the lattice
// point alone, so shared edges move together. It is zero within 40 m of the crossing cell. Needs uTime, uSwell.
const SWELL = /* glsl */`
vec2 swellAt(vec2 p) {
  float env = smoothstep(40., 150., length(p));
  return uSwell.z * env * vec2(-uSwell.y, uSwell.x) * sin(dot(p, uSwell.xy) * .0209 - uTime * .52);
}
`;
// the lift's rule of the place, on its own so that the plane, the rank birds and the hero's own geese all read the
// one test (it needs uWave declared before it)
const LIFT = /* glsl */`
// THE LIFT: where the plane gives up its geese in ranks. A rule of the place, in metres of the plane, the same over the
// whole plane. The ring's avenue (the line through the ring along its facing, z = 0) is kept clear; on both sides of
// it lanes run along the birds' heading (+X), uLiftA.y apart, the first uLiftA.x from the avenue's line. On every lane
// one lift-off front in uLiftB.z carries a rank (which one: uLiftB.x on the -z side, uLiftB.y on the +z side, and it
// moves on by one from lane to lane, so the ranks along a front stand uLiftB.z lanes apart).
// Returns (lane index or -1, metres from the lane's centre line, metres the lane's last rank front is past this point).
uniform vec4 uLiftA;     // first lane's centre line from the avenue, lane pitch, seed, 1 when the world has the lift
uniform vec4 uLiftB;     // rank phase of the -z lanes, of the +z lanes, fronts from one rank of a lane to its next, front speed
uniform vec4 uLiftR;     // the ring's place (xyz) and the reach of its pull in metres
vec3 liftLane(vec2 c) {
  float az = abs(c.y);
  float i = floor((az - uLiftA.x) / uLiftA.y + .5);
  if (i < 0. || uLiftA.w < .5) return vec3(-1., 1e3, -1.);
  float s = uWave.z - dot(c, uWave.xy);
  float k = floor(s / uWave.w);                     // the front that passed here last
  float r = mod(i + (c.y > 0. ? uLiftB.y : uLiftB.x) + k, uLiftB.z);
  return vec3(i, az - (uLiftA.x + uLiftA.y * i), s - k * uWave.w + r * uWave.w);
}
// which cells of a lane give their geese to the rank: every fifth along the heading, the same in its three files, so
// the birds stand three abreast, wingtip to wingtip
float liftPick(float i, float side) { return mod(2. * i + (side > 0. ? 1. : 0.), 5.); }
// 1 on the cells that give their goose to the lane's rank (L from liftLane of the cell's centre c)
float liftPicked(vec3 L, vec2 c) {
  float f = floor(L.y / 10. + .5);
  return (L.x >= 0. && abs(L.y) < 12.6 && abs(L.y - 10. * f) < 1. && abs(mod((c.x - 4.) / 8. - liftPick(L.x, c.y) + .5, 5.) - .5) < .25) ? 1. : 0.;
}
// 1 where the cell at c gives its goose to a rank and the front that passed it last is that rank's: its goose IS the
// rank's bird (the hero's own goose of that cell is not drawn for that pass)
float liftGives(vec2 c) {
  vec3 L = liftLane(c);
  return liftPicked(L, c) * step(L.z, uWave.w - .001);
}
`;
const GLSL = /* glsl */`
uniform sampler2D uSdf;
uniform vec3 uSwell;     // xy direction of travel, z amplitude in metres
uniform float uTime;
${SWELL}
uniform vec3 uInk, uPaper, uAccent;
uniform float uFront, uFog;
uniform vec4 uWave;      // xy front normal (XZ), z metres travelled, w spacing in metres
uniform vec2 uHole, uRed;
uniform float uRedOpen;   // 1: the accent fish cell is still empty (the world's mount has not locked into it yet)
uniform vec3 uCamL;   // camera in hero-local space

float sdfAt(vec2 p) { return texture2D(uSdf, p / vec2(8., 5.) + .5).r; }
// 1 on a line of width w repeated every per, antialiased by aa (all in the units of x)
float lineT(float x, float per, float w, float aa) {
  float d = abs(fract(x / per + .5) - .5) * per;
  return 1. - smoothstep(w * .5 - aa, w * .5 + aa, d);
}
// coverage of a line of width w repeated every per; stays right when the line or the gap between lines goes to nothing
float band(float x, float per, float w, float aa) {
  float d = abs(fract(x / per + .5) - .5) * per;
  float c = clamp((w * .5 - d) / (2. * aa) + .5, 0., 1.);
  c *= clamp(w / (2. * aa), 0., 1.);
  return 1. - (1. - c) * clamp((per - w) / (2. * aa), 0., 1.);
}
// straight cut lines across x whose width carries the tone (duty = share of ink). The period starts at P0 and doubles
// with every octave of the pixel footprint fx: every other line thins out and goes while its neighbours widen, so
// the far field is a few bold bars 12 to 24 pixels apart to the horizon. A bar is never thinner than 2.5 pixels,
// nor is the gap between two bars: below that the bar ends (or the gap closes), so nothing can shimmer.
float boldBand(float x, float per, float w, float f) {
  float d = abs(fract(x / per + .5) - .5) * per;
  float m = 2.5 * f;
  float ww = clamp(w, m, max(per - m, m));
  float c = clamp((ww * .5 - d) / (1.2 * f) + .5, 0., 1.);
  return max(c * step(.9 * f, w), step(per - .9 * f, w));
}
float octLines(float x, float fx, float P0, float duty) {
  float f = max(fx, 1e-5);
  float oc = max(0., log2(f * 24. / P0));
  float n = floor(oc), fo = fract(oc);
  float P = P0 * exp2(n);
  float a = boldBand(x - P0 * .5, 2. * P, P * duty * (1. + fo), f);
  float b = boldBand(x - P0 * .5 + P, 2. * P, P * duty * (1. - fo), f);
  return max(a, b);
}
float gooseAge(vec2 c) { return mod(uWave.z - dot(c, uWave.xy), uWave.w); }
float vacancy(float g) { return 1. - smoothstep(.42, .9, g / uWave.w); }

${LIFT}
// 1 where the goose of the cell at c has gone with its lane's rank: the gap is bare paper. The cells that give a
// bird empty 22 m behind the front, under the bird that lies thickened in its cell before it leaves, the rest of the
// lane's band cell by cell just behind them; each is inked again, cell by cell, before the lane's next rank comes.
float liftGone(vec2 c) {
  vec3 L = liftLane(c);
  if (L.x < 0. || abs(L.y) > 12.6) return 0.;
  float pick = liftPicked(L, c);
  float h = fract(sin(dot(c, vec2(12.9898, 78.233)) + uLiftA.z) * 43758.5453);
  return step(22. + 30. * h * (1. - pick), L.z) * step(L.z, uWave.w * (1.1 + .9 * h));
}
// the same wake where the tiling is too far to cut: a paler band along the lane behind its rank
float liftWake(vec2 p) {
  vec3 L = liftLane(p);
  if (L.x < 0.) return 0.;
  return (1. - smoothstep(11., 14., abs(L.y))) * smoothstep(22., 52., L.z) * (1. - smoothstep(uWave.w * 1.1, uWave.w * 2., L.z));
}

// ivory fish with black cut lines. q: metres from the cell centre, sd: distance inside the outline.
float fishTone(vec2 q, float sd, float aa, float det, float isRed, out float red) {
  float lw = max(.045, aa * 1.2);
  float key = smoothstep(lw - aa, lw + aa, sd);
  float inner = smoothstep(.10, .16, sd);
  float m = 0.;
  // scale rows over the back, cut heavier toward the dorsal edge, fading over the belly
  float back = smoothstep(-.9, 1.5, q.y);
  float bodyM = smoothstep(-2.5, -2.0, q.x) * (1. - smoothstep(1.0, 1.5, q.x));
  float duty = (.10 + .50 * back * back + .30 * (1. - smoothstep(.1, .7, sd))) * bodyM;
  m = max(m, lineT(q.x + .42 * (q.y - .2) * (q.y - .2), .40, .40 * duty, aa));
  // lateral line
  m = max(m, lineT(q.y - .08 - .04 * sin(q.x * 1.3), 40., .035 + aa * .5, aa) * bodyM * step(.5, fract(q.x * 1.6)));
  // tail fin rays
  float den = max(.25, -(q.x + 1.75));
  float tailM = 1. - smoothstep(-2.75, -2.45, q.x);
  m = max(m, lineT(q.y / den, .26, .085, aa / den) * tailM);
  // dorsal and belly fin rays
  float finM = smoothstep(1.25, 1.45, q.y) + (1. - smoothstep(-1.7, -1.45, q.y));
  m = max(m, lineT(q.x + .7 * q.y, .21, .07, aa) * finM);
  // gill arc
  float dg = length(q - vec2(3.05, .05));
  m = max(m, (1. - smoothstep(.03, .03 + aa, abs(dg - 1.5) - .01)) * step(q.x, 2.1) * (1. - smoothstep(1.0, 1.2, abs(q.y))));
  m *= inner * det;
  // eye: ring and pupil
  float de = length(q - vec2(2.62, .28));
  float ring = 1. - smoothstep(.035, .035 + aa, abs(de - .25));
  float pupil = 1. - smoothstep(.11 - aa, .11 + aa, de);
  float detE = 1. - smoothstep(.15, .5, aa);
  m = max(m, max(ring, pupil * (1. - isRed)) * detE);
  red = isRed * max(pupil * detE, smoothstep(1.32, 1.36, q.y) * smoothstep(.07, .09, sd) * (1. - lineT(q.x + .7 * q.y, .42, .05, aa) * det));
  return key * (1. - m);
}

// a fish at depth: cov 1 (near, solid) .. 0 (gone). Returns the paper mask to keep (under .5: leave to the black) and
// con, the paper contour. The body lines are never closer than four pixels nor thinner than a pixel and drop out one
// by one and leave the contour: lines and an outline, never a patch of static.
float farFish(vec2 q, float sd, float fw, float aa, float cov, float tone, out float con) {
  float thin = 1. - smoothstep(.55, .97, cov);
  float P = .5 * exp2(ceil(log2(max(fw * 4. / .5, 1.))));
  float u = q.y + .1 * sin(q.x * 1.4);
  float li = floor(u / P + .5);
  float lw = P * (.06 + .6 * cov) * (.6 + .8 * fract(sin(li * 12.9898) * 43758.5453));
  float ln = lineT(u, P, max(lw, 1.3 * fw), aa) * step(.7 * fw, lw);
  float cw = max(.10, 1.3 * fw);
  con = (1. - smoothstep(cw, cw + aa, sd)) * smoothstep(.3, .5, thin);
  return max(mix(1., ln, thin) * mix(1., tone, thin), con);
}

// black goose with ivory cut lines. sg: distance inside the goose outline. vac: 0 goose present .. 1 just left.
// hv: hatch coordinate for the vacated state (metres across the hatching).
float gooseTone(vec2 q, float sg, float aa, float det, float vac, float hv, float isRed, out float red) {
  float inner = smoothstep(.11, .17, sg);
  float az = abs(q.y);
  float wingM = smoothstep(.55, .85, az) * step(q.x, 1.9);
  // flight feathers: long cuts running back along the wing, coverts as short scallops
  float m = lineT(az + .42 * q.x, .44, .055 + aa * .4, aa) * wingM * step(q.x, .15 + .25 * az);
  m = max(m, lineT(q.x - .55 * az, .50, .05 + aa * .4, aa) * wingM * step(.15 + .25 * az, q.x) * step(.5, fract(az * 2.2 + .25)));
  // tail fan, neck ring, spine dashes, eye
  m = max(m, lineT(q.y, .24, .05 + aa * .4, aa) * (1. - smoothstep(-2.7, -2.5, q.x)));
  m = max(m, lineT(q.x - 1.95, 40., .07 + aa * .5, aa) * (1. - wingM));
  m = max(m, lineT(q.y, 40., .04 + aa * .5, aa) * step(.5, fract(q.x * 1.25)) * step(-2.2, q.x) * step(q.x, 1.2));
  float eye = 1. - smoothstep(.055 - aa, .055 + aa, length(vec2(q.x - 3.02, az - .11)));
  m = max(m, eye * (1. - smoothstep(.1, .3, aa)));
  float gone = smoothstep(0., .04, vac);
  m *= det * inner * (1. - gone);
  // vacated: parallel hatching whose line width carries the tone
  // (three bold cuts a cell; from further off the cell stays solid ink)
  float hatch = lineT(hv, 1.6, max(1.6 * (.10 + .25 * vac), 2.5 * aa), aa) * gone * smoothstep(.07, .12, sg) * (1. - smoothstep(.12, .2, aa));
  red = isRed * smoothstep(3.28, 3.32, q.x) * (1. - gone);
  return max(m, hatch);
}

// one point of the infinite tiling. p in lattice metres. lockAll > .5 ignores the locking front.
// returns tone; red = accent mask; hole = 1 inside the open cell.
float tilingTone(vec2 p, float aa, float det, float lockAll, vec2 vacCell, out float red, out float hole) {
  float sd = sdfAt(p);
  float s = (p.x * .25 + p.y * .4) * .5, t = (p.x * .25 - p.y * .4) * .5;
  float i = floor(s + .5), j = floor(t + .5);
  vec2 c = vec2(4. * (i + j), 2.5 * (i - j));
  vec2 q = p - c;
  bool rhFish = mod(i + j, 2.) < .5;
  bool fish = sd > 0.;
  if (fish != rhFish) { c += vec2(q.x > 0. ? 4. : -4., q.y > 0. ? 2.5 : -2.5); q = p - c; }
  red = 0.; hole = 0.;
  float tone;
  if (fish) {
    float isRed = (abs(c.x - uRed.x) < .5 && abs(c.y - uRed.y) < .5) ? 1. : 0.;
    float lk = max(lockAll, step(c.x, uFront) * (1. - isRed * uRedOpen));
    tone = fishTone(q, sd, aa, det, isRed * (1. - lockAll), red) * lk;
    red *= lk;
    // the lift: beside a gap that is bare paper the fish has no key line to print (paper against paper; a line left
    // there would be a net of outlines a pixel thin from the middle distance on): its hatching alone cuts it
    if (lockAll < .5) {
      float kb = max(.045, aa * 1.2) + aa;
      tone = max(tone, liftGone(c + vec2(q.x > 0. ? 4. : -4., q.y > 0. ? 2.5 : -2.5)) * lk * step(0., uCamL.y) * (1. - smoothstep(kb, kb + aa, sd)));
    }
  } else {
    if (lockAll < .5 && abs(c.x - uHole.x) < .5 && abs(c.y - uHole.y) < .5) hole = 1.;
    float lk = max(lockAll, step(c.x + 4., uFront));
    float vac = vacancy(gooseAge(c)) * step(0., uCamL.y);   // from below the gaps stay solid ink
    if (lockAll > .5) {   // ring: vacCell = (progress, count); innermost geese leave one by one
      float w = clamp((vacCell.x * (vacCell.y + 5.) - mod(floor(c.x / 8.) * 7., vacCell.y)) / 5., 0., 1.);
      vac = abs(c.y - 2.5) < .5 ? step(.001, w) * .75 : 0.;
    }
    float hv = lockAll > .5 ? (p.x + p.y) * .7071 : dot(p, vec2(-uWave.y, uWave.x));
    float r2;
    tone = gooseTone(q, -sd, aa, det, vac, hv, 0., r2) * lk;
    // the lift: a gap whose goose has gone with a rank is bare paper (from below the gaps stay solid ink)
    if (lockAll < .5) tone = max(tone, liftGone(c) * lk * step(0., uCamL.y));
  }
  return tone;
}
`;

const FOG_V = '#include <fog_pars_vertex>';
const FOG_F = '#include <fog_pars_fragment>';
const FOG_APPLY = 'vec3 preFog = gl_FragColor.rgb;\n#include <fog_fragment>\ngl_FragColor.rgb = mix(preFog, gl_FragColor.rgb, uFog);';

function makePlaneMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared), fog: true, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vP;\n${FOG_V}
      void main() { vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec3 vP;\n${FOG_F}\n${GLSL}
      void main() {
        vec2 p = vP.xz - swellAt(vP.xz);
        float fx = fwidth(p.x), fz = fwidth(p.y);
        float fw = max(fx, fz);
        float aa = clamp(fw * .75, .002, .6);
        float det = 1. - smoothstep(.07, .3, fw);
        float red, hole;
        float tone = tilingTone(p, aa, det, 0., vec2(0.), red, hole);
        if (hole > .5) discard;
        // unlaid sea: ink with a few level cuts
        float lockP = step(p.x, uFront);
        float row = floor(p.y / 1.9 + .5);
        float sea = lineT(p.y + .12 * sin(p.x * .5 + row), 1.9, .05 + aa * .5, aa) * step(.72, sin(p.x * .35 + row * 2.4)) * det * (1. - lockP);
        tone = max(tone, sea);
        // at a grazing angle the footprint is long one way and the isotropic edge width blurs the other: cut it back to a pixel
        float e = clamp(.5 * min(fx, fz) / max(fw, 1e-5) * (fw * .75 / aa), .09, .5);
        float T = smoothstep(.5 - e, .5 + e, tone);
        // far field: the ranks of the tiling become level cut lines of the same average tone. The hand-over is cut, not
        // blended: lines open across the fish and close across the geese until both carry the same hatching.
        float w = max(smoothstep(1.0, 2.1, fx), smoothstep(.8, 1.6, fz)) * lockP;
        float age = mod(uWave.z - dot(p, uWave.xy), uWave.w);
        float vacP = vacancy(age) * step(0., uCamL.y);
        // every lift-off front is a line of tone to the horizon: a dark edge where the geese stand up, a pale wake behind it
        float duty = .5 - .24 * vacP + .42 * (1. - smoothstep(6., 70., age)) * step(0., uCamL.y);
        duty -= .30 * liftWake(p) * step(0., uCamL.y);      // the lane a rank has left: paler
        float inkF = octLines(p.x, fx, 8., duty * w);
        float inkG = octLines(p.x, fx, 8., 1. - (1. - duty) * w);
        float ink = mix(1. - inkG, 1. - inkF, T);
        ink = mix(T, ink, step(.001, w));
        vec3 col = mix(uInk, uPaper, ink);
        col = mix(col, uAccent, red * (1. - w));
        gl_FragColor = vec4(col, 1.);
        ${FOG_APPLY}
      }`,
  });
}

// ---------- fish: rise, file, roll flat, lock ----------
function makeFishMaterial(shared, own) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, own), fog: true, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aCell;
      uniform vec2 uFocus; uniform vec2 uFishP; uniform float uTime, uFront; uniform vec2 uRed; uniform vec3 uSwell;
      varying vec2 vQ; varying float vCov, vRed, vUp;\n${FOG_V}\n${SWELL}
      void main() {
        float P = uFishP.x, PZ = uFishP.y;
        float cz = aCell.y + PZ * floor((uFocus.y - aCell.y) / PZ + .5);
        float cx = aCell.x + P * ceil((uFront - aCell.x) / P);
        float r1 = aCell.z, r2 = aCell.w;
        float e = clamp((cx - uFront) / P, 0., 1.);            // 1 deep in the shoal .. 0 locked
        float run = 64. + 30. * r1, depth = 44. + 30. * r2;
        vec3 off = vec3(-run * e, -depth * pow(e, 1.7), 0.);
        float loose = smoothstep(.22, .75, e);
        float ph = uTime * .33 + cx * .045 + cz * .02;
        off.z += loose * (16. * (r2 - .5) + 7. * sin(ph + r1 * 6.));
        off.y += loose * 4. * sin(uTime * .29 + r2 * 31.);
        off.x += loose * 6. * cos(ph * .8 + r1 * 17.);
        off.y = min(off.y, -.04);
        float dpt = -off.y;
        float pitch = atan(depth * 1.7 * pow(e, .7) / run) * smoothstep(.3, 4., dpt);
        float yaw = loose * .45 * cos(ph + r1 * 6.);
        // roll: upright while swimming, a quarter turn flat in the last 6 m, never poking through the plane
        float flat_ = smoothstep(-6., -.25, off.y);
        float rho = min((1. - flat_) * 1.5708, asin(clamp((dpt - .04) / 2.8, 0., 1.)));
        vec3 lp = position;
        float swim = 1. - flat_;
        float w = swim * (.10 + .34 * (1. - smoothstep(-4., 1.5, lp.x))) * sin(lp.x * 1.1 + uTime * (5. + 2. * r1) + r2 * 20.);
        float pec = swim * .25 * sin(uTime * 7. + r1 * 9.) * (1. - smoothstep(-2.2, -1.2, lp.z)) * step(-1., lp.x);
        w += pec;
        vec3 b = vec3(lp.x, lp.z * sin(rho) + w * cos(rho), lp.z * cos(rho) - w * sin(rho));
        float cp = cos(pitch), sp = sin(pitch);
        b = vec3(b.x * cp - b.y * sp, b.x * sp + b.y * cp, b.z);
        float cy = cos(yaw), sy = sin(yaw);
        b = vec3(b.x * cy + b.z * sy, b.y, -b.x * sy + b.z * cy);
        vec2 sw = swellAt(vec2(cx, cz));
        vec3 lctr = vec3(cx + sw.x, 0., cz + sw.y) + off;
        float dist = distance((modelMatrix * vec4(lctr, 1.)).xyz, cameraPosition);
        vCov = (1. - smoothstep(34., 175., dist)) * (1. - smoothstep(.9, 1., e)) * (1. - smoothstep(.40, .5, abs(cz - uFocus.y) / PZ));
        // at the end of its range a fish dwindles away whole (a locked fish is always full size)
        vec3 lpos = lctr + b * mix(1., smoothstep(0., .2, vCov), step(.001, e));
        vec4 wp = modelMatrix * vec4(lpos, 1.);
        vQ = position.xz;
        vUp = wp.y - cameraPosition.y + 1.5;
        vRed = (abs(cx - uRed.x) < .5 && abs(cz - uRed.y) < .5) ? 1. : 0.;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        if (uFront > 1e5 || vCov <= .001 || vRed > .5) gl_Position = vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vQ; varying float vCov, vRed, vUp;\n${FOG_F}\n${GLSL}
      void main() {
        float fw = max(fwidth(vQ.x), fwidth(vQ.y));
        float aa = clamp(fw * .75, .002, .6);
        // a body seen edge-on carries no cuts (they would beat against the pixels): plain ivory and its key line
        float det = (1. - smoothstep(.07, .3, fw)) * smoothstep(.12, .3, min(fwidth(vQ.x), fwidth(vQ.y)) / max(fw, 1e-5));
        float red;
        float sd = sdfAt(vQ);
        float tone = fishTone(vQ, sd, aa, det, vRed, red);
        // depth is size and overlap: a far fish is a solid paper silhouette inside an ink key line, which parts it from
        // the fish behind it and from the ceiling. Never an outline: hundreds of those tangle into a net.
        float thin = 1. - smoothstep(.55, .97, vCov);
        float cw = max(.12, 1.6 * fw);
        tone = mix(tone, smoothstep(cw, cw + aa, sd), smoothstep(0., .45, thin));
        red *= 1. - thin;
        // the one cut the plane makes, made here too. aa is sized for the longer axis of the footprint, so on a sheet seen
        // at a grazing angle every edge was spread over several pixels along the axis that is well resolved, and the key
        // line and the silhouette ran into each other: a soft grey smear instead of ink and paper. Cut back to a pixel.
        float eg = clamp(.5 * min(fwidth(vQ.x), fwidth(vQ.y)) / max(fw, 1e-5) * (fw * .75 / aa), .09, .5);
        tone = smoothstep(.5 - eg, .5 + eg, tone);
        vec3 col = mix(uInk, uPaper, tone);
        col = mix(col, uAccent, red);
        gl_FragColor = vec4(col, 1.);
        ${FOG_APPLY}
      }`,
  });
}

// ---------- geese: swell, unfold, beat twice, peel away into chevrons ----------
function makeGooseMaterial(shared, own, vs) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, own), fog: true, side: THREE.DoubleSide,
    vertexShader: vs || `attribute vec4 aCell;
      uniform vec2 uFocus; uniform vec4 uGooseP;   // period X, period Z, front speed, skein spacing
      uniform float uTime, uFront, uRiseX; uniform vec4 uWave; uniform vec3 uCamL, uCamD; uniform vec3 uSwell; uniform vec2 uFocusG;
      varying vec2 vQ; varying float vCov, vKeel, vNear;\n${FOG_V}\n${SWELL}
      ${LIFT}
      void main() {
        float PX = uGooseP.x, PZ = uGooseP.y;
        float cx = aCell.x + PX * floor((uFocusG.x - aCell.x) / PX + .5);
        float cz = aCell.y + PZ * floor((uFocusG.y - aCell.y) / PZ + .5);
        float r1 = aCell.z, r2 = aCell.w;
        float g = mod(uWave.z - dot(vec2(cx, cz), uWave.xy), uWave.w);
        float tt = g / uGooseP.z;                 // seconds since the front passed this cell
        // every goose swells and beats on the plane; most then thin into strokes where they stand and two in five
        // go on up, so the lifted flock has air between its birds and reads bird by bird
        float del = .9 * fract(r1 * 7.31);         // they do not all leave on the same beat
        float riser = (r1 <= .42 && cx < uRiseX) ? 1. : 0.;
        float life = mix(.85 + del, 4.5 + 1.5 * r2 + del, riser);
        // peel away: climb, run ahead, close toward the skein line, far birds fall back into a chevron
        float tf = max(tt - 1.05 - del, 0.);
        float SK = uGooseP.w;
        float dzs = cz - SK * floor(cz / SK + .5);
        float conv = smoothstep(0., 1.7, tf);
        // they gather speed to a little more than ours and hold it, so a risen flock stays about us for seconds
        float run = mix(11. * tf * tf, 28.6 * tf - 18.59, step(1.3, tf));
        vec3 off = vec3(run - abs(dzs) * .85 * conv, 8. * pow(tf, 1.55) + r2 * 1.5 * conv, -dzs * .42 * conv);
        vec2 sw = swellAt(vec2(cx, cz));
        vec3 ctr = vec3(cx + sw.x, 0., cz + sw.y) + off;
        // airborne birds keep about 11 m from the line of travel (uCamD, the way the camera is heading): they part
        // round it as round a tube
        vec3 dv = ctr - uCamL;
        float al = dot(dv, uCamD);
        vec3 perp = dv - uCamD * al + vec3(0., r2 - .3, r1 - .21) * .05;
        float pl = max(length(perp), 1e-3);
        ctr += perp / pl * (sqrt(pl * pl + 120.) - pl) * (1. - smoothstep(10., 42., abs(al))) * smoothstep(0., .35, tf);
        ctr.y = max(ctr.y, off.y * .35);
        float dc = distance(ctr, uCamL);
        vec3 lp = position;
        float sgn = lp.z < 0. ? -1. : 1.;
        float az = abs(lp.z);
        float swell = smoothstep(0., .3, tt), unfold = smoothstep(.5 + del, 1.4 + del, tt);   // wings open as it leaves the plane
        float beatP = 6.2832 * 1.9 * (tt - .28) + r1 * .6;
        float beat = sin(beatP) * smoothstep(.25, .5, tt);
        float ang = (beat * mix(.58, .4, smoothstep(55., 95., dc)) + .14) * unfold;   // beats about a raised V, never a tent
        float arm = max(az - .9, 0.) * (1. + 1.25 * unfold);        // 5 m folded -> 9 m span, rigid about the hinge
        float y = max(arm * sin(ang), -.9 * (.5 * swell + off.y));   // on the plane the wings beat upward only: nothing dips through it
        float span = min(az, .9) + arm * cos(ang);
        float x = lp.x - unfold * arm * .22;                        // tips sweep back
        y += .05 + .5 * swell - .22 * beat + lp.y * swell * (.55 + .45 * unfold) * 1.5;
        vKeel = abs(lp.y) > 1e-4 ? 1. : 0.;
        float pitch = .12 * swell + .38 * smoothstep(0., .5, tf) * (1. - .6 * smoothstep(1., 1.8, tf));
        vec3 b = vec3(x * cos(pitch) - y * sin(pitch), x * sin(pitch) + y * cos(pitch), sgn * span);
        // the lens stays clear: nothing passes within 6 m of it, and only a few birds within 16 m; far off the
        // flock is thinned so the birds read one by one
        float nearK = smoothstep(3.2, 5.8, dc);
        float sc = mix(1., nearK, smoothstep(.1, .5, tt)) * (r1 > .5 ? 1. - smoothstep(95., 130., dc) : 1.);
        vNear = 1. - smoothstep(10., 40., dc);
        vec3 lpos = ctr + b * sc;
        vec4 wp = modelMatrix * vec4(lpos, 1.);
        float dist = distance(wp.xyz, cameraPosition);
        float edge = max(abs(cx - uFocusG.x) / PX, abs(cz - uFocusG.y) / PZ);
        vCov = (1. - smoothstep(mix(.60, .84, riser), 1., tt / life)) * (1. - smoothstep(140., 420., dist) * .7) * (1. - smoothstep(.40, .5, edge));
        vQ = position.xz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        // from below the plane no goose is drawn: wings and keels would poke through the ceiling
        if (cx + 4. >= uFront || tt >= life || vCov <= .001 || uCamL.y < 0. || sc < .02) gl_Position = vec4(2., 2., 2., 1.);
        if (liftGives(vec2(cx, cz)) > .5) gl_Position = vec4(2., 2., 2., 1.);   // the lift: this cell's goose is the rank's bird
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vQ; varying float vCov, vKeel, vNear;\n${FOG_F}\n${GLSL}
      void main() {
        float fx = fwidth(vQ.x), fz = fwidth(vQ.y);
        float fw = max(fx, fz);
        float aa = clamp(fw * .75, .002, .6);
        // feather cuts only where the wing is seen broadly enough to carry them: a wing seen steeply stays plain ink
        float det = (1. - smoothstep(.03, .10, fw)) * smoothstep(.12, .3, min(fx, fz) / max(fw, 1e-5));
        float red;
        float sg = -sdfAt(vQ + vec2(4., 2.5));
        // the birds that pass close keep their feather cuts whatever the angle of the wing
        det = max(det, vNear * (1. - smoothstep(.10, .22, fw)));
        float tone = vKeel > .01 ? 0. : gooseTone(vQ, sg, aa, det, 0., 0., 0., red);
        // a paper key line round every lifted bird, so black wings over black wings still read as birds
        float kw = max(.12, min(aa * 1.5, .32)) + .28 * vNear;
        tone = max(tone, vKeel > .01 ? 0. : 1. - smoothstep(kw - aa, kw + aa, sg));
        // far geese thin into a few black strokes, like the horizon band they fly into
        float thin = 1. - smoothstep(.45, .8, vCov);
        float keep = mix(1., lineT(abs(vQ.y) + .42 * vQ.x, .44, .44 * (.10 + .90 * vCov / .8), aa), thin);
        if (thin > .02 && keep < .5) discard;
        tone = smoothstep(.3, .7, tone);
        gl_FragColor = vec4(mix(uInk, uPaper, tone), 1.);
        ${FOG_APPLY}
      }`,
  });
}

function cellInstances(geo, cols, rows, x0, z0, rng) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; g.setAttribute('position', geo.getAttribute('position'));
  const n = cols * rows, a = new Float32Array(n * 4);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    a[k++] = x0 + c * CELL_X; a[k++] = z0 + (r - Math.floor(rows / 2)) * CELL_Z; a[k++] = rng(); a[k++] = rng();
  }
  g.setAttribute('aCell', new THREE.InstancedBufferAttribute(a, 4));
  g.instanceCount = n;
  return g;
}

// ---------- the exit annulus: the same tiling through a log-polar map ----------
function makeRingMaterial(shared, own) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, own), fog: true, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vR;\n${FOG_V}
      void main() { vR = position.xy; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying vec2 vR; uniform vec4 uRing; uniform float uRout;\n${FOG_F}\n${GLSL}
      void main() {
        float r = max(length(vR), .01);
        float kap = uRing.y * 8. / 6.2831853;
        float th = atan(vR.y, vR.x) + uRing.z;
        vec2 p = vec2(th * kap, log(r / uRing.x) * kap);
        float sc = kap / r;
        float fl = max(fwidth(vR.x), fwidth(vR.y));
        float fw = fl * sc;
        float aa = clamp(fw * .75, .002, .6);
        float det = 1. - smoothstep(.07, .3, fw);
        float red, hole;
        float tone = tilingTone(p, aa, det, 1., vec2(uRing.w, uRing.y), red, hole);
        float din = r - uRing.x, dout = uRout - r, al = fl * .75 + 1e-4;
        tone *= smoothstep(.20, .20 + al * 2., min(din, dout));
        // the accent hairline is never under 2.5 pixels wide
        float hw = max(.08, 2.5 * fl);
        float hair = smoothstep(.03, .03 + al, din) * (1. - smoothstep(.03 + hw, .03 + hw + al, din));
        // far away the tiling is too fine to cut: there the ring is a solid ink annulus with one inner band of bold
        // paper teeth, one to a tile. The hand-over is a cut: it goes tooth by tooth, never through a blend.
        float wf = smoothstep(.5, 1.2, fw);
        float ts = th * uRing.y / 6.2831853;
        float tid = floor(ts);
        float tf = abs(fract(ts) - .5);
        float ta = max(fwidth(ts), 1e-4);
        ta = ta > .5 ? 1e-4 : ta;                         // the seam of atan
        float bandW = .40 * (uRout - uRing.x);
        float teeth = (1. - smoothstep(.27 - ta, .27 + ta, tf)) * smoothstep(.55 + hw, .55 + hw + 2. * al, din) * (1. - smoothstep(bandW, bandW + 2. * al, din));
        float pickT = step(fract(sin(mod(tid, uRing.y) * 12.9898 + 4.1) * 43758.5453), wf * 1.02 - .01);
        tone = mix(tone, teeth, pickT);
        vec3 col = mix(uInk, uPaper, tone);
        col = mix(col, uAccent, hair);
        gl_FragColor = vec4(col, 1.);
        ${FOG_APPLY}
      }`,
  });
}

const RING_GOOSE_VS = `attribute vec2 aK;
  uniform vec4 uRing; uniform float uTime;
  varying vec2 vQ; varying float vCov, vKeel, vNear;\n${FOG_V}
  void main() {
    float n = uRing.y, kap = n * 8. / 6.2831853;
    float w = clamp((uRing.w * (n + 5.) - mod(aK.x * 7., n)) / 5., 0., 1.);
    vec2 L = vec2(8. * aK.x + 4., 2.5);
    // locked: the exact log-polar image of the table position
    float th = (L.x + position.x) / kap - uRing.z, r = uRing.x * exp((L.y + position.z) / kap);
    vec3 R0 = vec3(r * cos(th), r * sin(th), .02);
    // leaving: unfold, beat, turn the bill through the opening and go
    float thc = L.x / kap - uRing.z, rc = uRing.x * exp(L.y / kap), sc = rc / kap;
    vec3 rad = vec3(cos(thc), sin(thc), 0.), tang = vec3(-rad.y, rad.x, 0.);
    float u = smoothstep(0., .35, w), turn = smoothstep(.05, .55, w);
    vec3 d = normalize(mix(tang, vec3(-rad.xy, -.3), turn));
    vec3 wa = normalize(rad - d * dot(rad, d) + tang * turn * .6);
    vec3 nrm = cross(wa, d);
    float az = abs(position.z), sgn = position.z < 0. ? -1. : 1.;
    float beatP = w * 34. + aK.y * 6.;
    float ang = (sin(beatP) * .5 + .45) * u;     // wings stay raised: never a flat sheet seen edge-on
    float arm = max(az - .9, 0.) * (1. + 1.5 * u);
    float span = min(az, .9) + arm * cos(ang);
    float y = arm * sin(ang) + position.y * u * 1.5;
    vKeel = abs(position.y) > 1e-4 ? 1. : 0.;
    // they stay on the camera's side of the portal surface and shrink into its centre
    vec3 C = rad * rc * (1. - smoothstep(.08, 1., w)) * (1. + .12 * sin(6.2832 * w)) + vec3(0., 0., .15 + 3. * sin(3.1416 * w));
    vec3 F = C + sc * (1. + 1.1 * u) * (1. - smoothstep(.6, .9, w)) * (position.x * d + sgn * span * wa + y * nrm);
    vec3 lpos = mix(R0, F, smoothstep(0., .12, w));
    vCov = 1.; vNear = 0.;
    vQ = position.xz;
    vec4 mvPosition = modelViewMatrix * vec4(lpos, 1.);
    gl_Position = projectionMatrix * mvPosition;
    if (w <= 0. || w >= .9) gl_Position = vec4(2., 2., 2., 1.);
    #include <fog_vertex>
  }`;

// ---------- assembly ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 3) ? opts.palette : DEF_PALETTE;
  const edition = opts.edition || 'day';
  let ink = new THREE.Color(pal[0]), paper = new THREE.Color(edition === 'golden' ? '#C9B48A' : pal[1]);
  if (edition === 'night') [ink, paper] = [paper, ink];
  const accentHex = opts.accent || rng.pick([pal[2], pal[2], pal[2], '#1F4E8C', '#D9A21E']);
  const accent = new THREE.Color(accentHex);

  const table = makeEdgeTable(rng);
  const outline = makeOutlines(table);
  await ctx.yield?.();
  const sdf = await makeSdfTexture(outline.fish, ctx);
  await ctx.yield?.();
  const fishGeo = fishGeometry(outline.fish);
  await ctx.yield?.();
  const gooseGeo = addKeel(gooseGeometry(outline.goose));
  await ctx.yield?.();

  const frontAngle = rng.sign() * THREE.MathUtils.degToRad(rng.range(27, 33));
  const frontDir = new THREE.Vector2(Math.cos(frontAngle), Math.sin(frontAngle));
  const frontSpeed = 40, frontSpacing = Math.round(rng.range(150, 172));
  const skein = rng.pick([30, 35, 40]);
  const fishCols = opts.fishCols || 16, fishRows = opts.fishRows || 44;
  const gooseCols = opts.gooseCols || 20, gooseRows = opts.gooseRows || 36;
  const ringN = rng.pick([20, 24]), ringIn = 7, ringKap = ringN * 8 / (Math.PI * 2), ringOut = ringIn * Math.exp(15 / ringKap);

  const crossingFish = new THREE.Vector3(0, 0, 0), crossingGoose = new THREE.Vector3(4, 0, 2.5);
  const shared = {
    uSdf: { value: sdf }, uInk: { value: ink }, uPaper: { value: paper }, uAccent: { value: accent },
    uTime: { value: 0 }, uFront: { value: 0 }, uFog: { value: opts.fog ?? 1 },
    uWave: { value: new THREE.Vector4(frontDir.x, frontDir.y, 0, frontSpacing) },
    uHole: { value: new THREE.Vector2(crossingGoose.x, crossingGoose.z) },
    uRed: { value: new THREE.Vector2(crossingFish.x, crossingFish.z) },
    uRedOpen: { value: 0 },
    uCamL: { value: new THREE.Vector3(0, 20, 0) }, uFocus: { value: new THREE.Vector2() },
    uCamD: { value: new THREE.Vector3(1, 0, 0) }, uFocusG: { value: new THREE.Vector2() }, uRiseX: { value: 1e9 },
    uSwell: { value: new THREE.Vector3(Math.cos(frontAngle * -1.7 + 0.5), Math.sin(frontAngle * -1.7 + 0.5), opts.swell ?? 0.5) },
    // the lift (see liftLane): off until a world sets uLiftA.w to 1 and builds the ranks
    uLiftA: { value: new THREE.Vector4(67.5, 150, 0, 0) }, uLiftB: { value: new THREE.Vector4(0, 1, 2, frontSpeed) },
    uLiftR: { value: new THREE.Vector4(1e6, 0, 0, 1) },
  };

  const object = new THREE.Group();
  object.name = 'figure-and-ground-hero';

  const planeGeo = new THREE.CircleGeometry(opts.planeRadius || 2600, 64);
  planeGeo.rotateX(-Math.PI / 2);
  const plane = new THREE.Mesh(planeGeo, makePlaneMaterial(shared));
  plane.frustumCulled = false; plane.renderOrder = 0;
  object.add(plane);
  await ctx.yield?.();

  const fish = new THREE.Mesh(cellInstances(fishGeo, fishCols, fishRows, 0, 0, rng),
    makeFishMaterial(shared, { uFishP: { value: new THREE.Vector2(fishCols * CELL_X, fishRows * CELL_Z) } }));
  fish.frustumCulled = false;
  object.add(fish);
  await ctx.yield?.();

  const geese = new THREE.Mesh(cellInstances(gooseGeo, gooseCols, gooseRows, 4, 2.5, rng),
    makeGooseMaterial(shared, { uGooseP: { value: new THREE.Vector4(gooseCols * CELL_X, gooseRows * CELL_Z, frontSpeed, skein) } }));
  geese.frustumCulled = false;
  object.add(geese);
  await ctx.yield?.();

  // portal annulus, facing back along the path (-X)
  const uRing = { value: new THREE.Vector4(ringIn, ringN, 0, 0) };
  const portalRing = new THREE.Group();
  portalRing.rotation.y = -Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringIn, ringOut, 96, 1), makeRingMaterial(shared, { uRing, uRout: { value: ringOut } }));
  portalRing.add(ring);
  const rg = new THREE.InstancedBufferGeometry();
  rg.index = gooseGeo.index; rg.setAttribute('position', gooseGeo.getAttribute('position'));
  const ak = new Float32Array(ringN * 2);
  for (let k = 0; k < ringN; k++) { ak[k * 2] = k; ak[k * 2 + 1] = rng(); }
  rg.setAttribute('aK', new THREE.InstancedBufferAttribute(ak, 2));
  rg.instanceCount = ringN;
  const ringGeese = new THREE.Mesh(rg, makeGooseMaterial(shared, { uRing }, RING_GOOSE_VS));
  ringGeese.frustumCulled = false;
  portalRing.add(ringGeese);
  object.add(portalRing);
  await ctx.yield?.();

  const portalY = 2 + ringOut;
  const portalSeat = { position: new THREE.Vector3(), facing: new THREE.Vector3(-1, 0, 0) };
  const flyThrough = [];
  function placePortal(x, y, z) {
    portalRing.position.set(x, y, z);
    portalSeat.position.set(x, y, z);
    const gz = crossingGoose.z;
    flyThrough.length = 0;
    flyThrough.push(
      new THREE.Vector3(-230, -60, gz), new THREE.Vector3(-170, -60, gz), new THREE.Vector3(-100, -42, gz),
      new THREE.Vector3(-34, -13.8, gz), new THREE.Vector3(crossingGoose.x, 0, gz), new THREE.Vector3(26, 7, gz),
      new THREE.Vector3(Math.min(70, x * 0.4), 8, gz - 8), new THREE.Vector3(x * 0.7, 10, z + 6),
      new THREE.Vector3(x - 60, y, z), new THREE.Vector3(x, y, z));
  }
  placePortal(opts.portalDistance ?? 150, portalY, 0);

  let frontSet = false, frontPhase = 0, demo = opts.demo ?? true;
  const _c = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Matrix4();

  const radius = 60, height = 40;
  const viewCenter = new THREE.Vector3(0, 2, 0);

  return {
    object, radius, height, center: viewCenter,
    ground: false, groundY: 0,
    edition, accent: accentHex, outline, sdfTexture: sdf, glsl: GLSL, uniforms: shared, portalRing,
    geo: { fish: fishGeo, goose: gooseGeo }, plane, fish, geese,
    anchors: {
      crossingFish, crossingGoose,
      crossingDir: new THREE.Vector3(Math.cos(0.349), Math.sin(0.349), 0),
      flyThrough, portalSeat,
      viewBelow: { position: new THREE.Vector3(-70, -30, 2.5), target: new THREE.Vector3(0, 0, 2.5) },
      viewAbove: { position: new THREE.Vector3(40, 8, -4), target: new THREE.Vector3(160, 2, 0) },
      viewPortal: { position: new THREE.Vector3(portalSeat.position.x - 45, portalY, 0), target: portalSeat.position },
      frontDir: new THREE.Vector3(frontDir.x, 0, frontDir.y), frontSpeed, frontSpacing,
      ringInner: ringIn, ringOuter: ringOut,
    },
    setLockFront(x) { if (!frontSet && demo) uRing.value.w = 0; frontSet = true; shared.uFront.value = x; },
    setFrontPhase(m) { frontPhase = m; },
    setHole(x, z) { shared.uHole.value.set(x, z); },
    setRedFish(x, z) { shared.uRed.value.set(x, z); },
    setRedOpen(v) { shared.uRedOpen.value = v ? 1 : 0; },
    setFrontSpacing(m) { shared.uWave.value.w = m; },
    setRiseLimit(x) { shared.uRiseX.value = x; },
    setPortalProgress(v) { uRing.value.w = Math.min(1, Math.max(0, v)); demo = false; },
    placePortal,
    update(dt, time, camera) {
      shared.uTime.value = time;
      shared.uWave.value.z = time * frontSpeed + frontPhase;
      uRing.value.z = time * THREE.MathUtils.degToRad(3);
      if (!frontSet) shared.uFront.value = -60 + ((time * 6) % 130);
      if (demo && !frontSet) uRing.value.w = (time * 0.05) % 1;
      if (camera) {
        object.updateWorldMatrix(true, false);
        _m.copy(object.matrixWorld).invert();
        _c.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_m);
        camera.getWorldDirection(_d).transformDirection(_m);
        shared.uCamL.value.copy(_c);
        // the action window sits where the camera is looking at the plane, at most 60 m ahead
        const hl = Math.hypot(_d.x, _d.z);
        let ahead = 45;
        if (Math.abs(_d.y) > 1e-3 && -_c.y / _d.y > 0) ahead = Math.min(60, (-_c.y / _d.y) * hl);
        const fx = hl > 1e-3 ? _d.x / hl : 1, fz = hl > 1e-3 ? _d.z / hl : 0;
        shared.uFocus.value.set(_c.x + fx * ahead, _c.z + fz * ahead);
        // the geese window reaches further back: birds that rose behind us fly forward into view
        const back = opts.gooseBack ?? 0;
        shared.uFocusG.value.set(_c.x + fx * (ahead - back), _c.z + fz * (ahead - back));
        shared.uCamD.value.copy(_d);
      }
    },
    dispose() { /* everything is reachable from object */ },
  };
}
