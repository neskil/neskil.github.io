// THE FISHING HORSESHOE: hero set piece of "pelican-collage" (The Tissue-Paper Pelicans).
//
// Sixty great white pelicans, each a jointed toy of sixteen torn tissue-paper sheets, swim in a horseshoe and
// fish together: wings half-lift (the ink-dark flight feathers flash), the bird tips forward and drives head
// and bill under with its tail in the air, comes up with the apricot pouch swollen and sagging while torn
// white strips of water drain from it, tosses the bill up to swallow. The dip runs round the arc from the left
// tip to the right tip in half a cycle as a white wave of raised wings, leaving a chain of torn white rings on
// the water; silver fish jump as confetti inside the arc. Behind, 200 more pelicans turn on banked wings in a
// thermal 115 m tall under a stack of torn cloud sheets with a hole in it: the way out.
//
// STYLE (how the collage is done, so the world can match it)
//   Unlit ShaderMaterials only; nothing reads scene lights. Every sheet is a "strip": a spine with a width
//   profile and a curl (flat card ... three-quarter tube), carrying aData = (paperU, paperV, edge, pieceId)
//   where edge is 0 on the sheet's rim and 1 on its centre line. The fragment shader (PAPER_GLSL below) tears
//   the rim: alpha = edge > 0.05 + 0.46 * tearNoise (alpha-tested, alphaToCoverage), paints a white fibrous
//   deckle just inside the tear (edge within ~0.11 of the threshold), then multiplies the sheet's flat colour
//   by brush streaks whose direction is rotated per piece and adds paper fibre. Noise comes from one tileable
//   256 px RGBA DataTexture (R tear, G fibre, B brush streaks, A blotch), looked up in the sheet's own
//   metres (never screen space); tear amplitude fades between 60 and 400 m. Paper white is 0.85. Shade is
//   drawn: every fisher is drawn twice in the same call, the second copy flagged as its lilac shadow sheet
//   (#B9B2DC over water), slipped 7 cm toward opts.shadowDir and 3 cm away from the lens, with no deckle.
//   Distance: colours are mixed 60 % toward mint-white by 900 m (uniform uHaze) and scene fog is respected.
//
// LOCAL SPACE  origin on the water at the centre of the horseshoe, +Y up, water at y = 0. The horseshoe opens
//              toward +Z (the camera arrives from +Z heading -Z); its mouth is at z = +20 and its back at
//              z = -20. "Left" is -X: the dip wave runs from the -X tip to the +X tip. Birds face the mouth.
//              The formation is a treadmill: it stays put while the water sheets, rings and wakes slide past
//              at 0.8 m/s toward -Z, so nothing skates. The thermal stands at opts.columnOffset.
// SIZE         horseshoe: radius 30 (44 m mouth closing to 30 m, 40 m deep), birds 1.2 m tall (2 m at the
//              toss). Reported radius 24, height 12 (what the part viewer frames). Whole piece with the
//              thermal: funnel of birds (radius 11..34 m, a sparse skirt to 85 m below y 80) from y 15 to 128 at columnOffset, cloud sheets y 119..145.
// COST         about 100k triangles, 6 draw calls (water, rings+shadows, fishers, soarers, scraps, cloud),
//              no lights, one 256 px texture. Build about 90-180 ms.
// LIGHTING     none needed (unlit paper). Wants a blue torn-paper sky and blue/teal water behind the white
//              birds, no fog, bloom threshold >= 0.9 so nothing here blooms. hero.uniforms.uTint (linear
//              colour multiply) and uShade (shadow sheet colour) regrade it for other hours.
//
// OPTS         palette      7 hex strings in brief order (paper white, apricot, cyan, green, straw, teal, honey).
//              fishers      number of fishing pelicans (default 60; brief range 44..76).
//              soarers      number of soaring pelicans (default 240 * ctx.quality.detail; 150..260).
//              dalmatian    fraction of silver-grey Dalmatian pelicans among the fishers (default: 0..3 birds).
//              columnOffset [x,y,z] of the thermal's axis foot (default [30, 0, -195]).
//              water        true (default) draws the hero's own collage lagoon disc (radius 215 m, centred half way to the thermal, y = 0, opaque:
//                           it hides diving heads). Pass false if the world lays its own OPAQUE sheet at y = 0.
//              cloud        true (default) draws the torn cloud stack with the portal hole above the thermal.
//              shadowDir    [x,y,z] direction the drawn shadows slip toward (default ahead-left, [-0.8,-0.25,-0.6]).
//              hour         'morning' (default) | 'dawn' | 'evening' | 'dusk': tints paper and shadow sheets.
//              weather      'gale' pulls the horseshoe tighter (mouth 36 -> 24 m).
//              joiners      [{ x, z, cx, cz, yaw, scale }]: extra fishers (a vanguard ahead of the mouth) at open / closed places;
//                           hero.joiners = { first, count } indexes them in fisherList, hero.setPhase(i, phase) times their dips.
//                           A joiner may carry its own seed and flush; hero.setPlace(i, x, z, yaw) moves a fisher before the first frame.
//              (makeFlock) mesh.userData.iD holds each flyer's own roll and nose-up pitch (x, y; radians), which the world may
//                           rewrite every frame like iA (the climb's flock is turned to the lens this way).
//              (makeFlock) slip: how far a flock's shadow sheets slip out (0.07 of the bird; wider slips lie further back);
//                           colors.back: a flat colour for the back sheet.
//
// PROGRESS     hero.setProgress(p), p = 0..1 while the camera crosses the horseshoe (brief: u 0.52 -> 0.68):
//              closes the mouth from 44 m to 30 m. Without it the mouth breathes slowly with time.
//              hero.setWave(cycles): phase of the dip wave in 3 s cycles; the bird at arc position s (0 left
//              tip .. 1 right tip) is at cycle fraction fract(cycles - 0.5 * s - 0.1), plunging at 0.07..0.20,
//              pouch up at 0.45..0.9. The brief's rule is hero.setWave(u * 40 / 3). Without it: time / 3.
//              With opts.waveLength (metres) the phase runs by arc metres instead (arc / waveLength), so the
//              wave is that long on the water; fisherList[i].phase is each bird's value. The uniform uAlert
//              (0..1, mesh.userData / shared U) brings every head up and stills the dip (the rare event).
//
// ANCHORS (local space)
//   flyThrough   ordered [x,y,z] points: down outside the left tip, then 0.6 m above the water along a line
//                3.2-4.4 m inside the left arm all the way round to the back of the arc, up over the back row,
//                the climb, the left curve, then 60 m straight at 45 degrees into the portal. Soarers are
//                rejection-placed >= 8.5 m from this line, fishers >= 3.05 m (measured in 3D).
//   portalSeat   { position, normal, direction }: centre of the 14 m portal in the cloud hole (y = 115 above
//                the column foot); direction is the final 45 degree flight direction, normal = -direction.
//   approachStart  start of the final straight 60 m.      columnFoot / columnTop: the thermal's axis.
//   horseshoeCenter, mouth, leftArm, rightBend: points for pois and the close pass. closestBird: the bird
//                nearest the left-arm pass (for the u 0.57 frame). viewpoints: three good still cameras.
//   clearance    { fishers, soarers } minimum distance in metres from flyThrough found at build.
//
// WORLD HOOKS  hero.makeFlock(list, opts) builds free-flying or launching birds from the same jointed pelican
//              (FLY mode of the bird shader): skeins, ibis, herons, terns, the eagle, the rare take-off.
//              The flock's instance places (mesh.userData.iA, count, copies) may be rewritten every frame.
//              hero.shape(s, k) is the arc itself, open (k 0) to closed (k 1).
//              hero.fisherList gives every fisher's open/closed position; opts.waterRadius / waterCenter /
//              waterDepthWrite let the world stretch the lagoon sheet under its channel.
//              await hero.standFish(path, PT, more), once the fishers are in their last places: the leaping fish stood off the line.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#FDFBF3', '#F7A65E', '#2FA8C9', '#8CC63F', '#E8C65A', '#1E7F86', '#DFA233'];
const TAU = Math.PI * 2;
const lin = (hex) => new THREE.Color(hex);
export const mixc = (a, b, t) => a.clone().lerp(b, t);

// ---------- paper atlas: tileable value noise, R tear, G fibre, B brush streaks, A blotch ----------
async function makePaperAtlas(rng, yieldFn) {
  const N = 256, L = 64, lat = new Float32Array(L * L * 4);
  for (let i = 0; i < lat.length; i++) lat[i] = rng();
  // periodic value noise: fx, fy integer frequencies (cells per tile), channel c picks a lattice layer
  const vn = (x, y, fx, fy, c) => {
    const px = x * fx, py = y * fy, ix = Math.floor(px), iy = Math.floor(py);
    let tx = px - ix, ty = py - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const x0 = ((ix % fx) + fx) % fx, x1 = (x0 + 1) % fx, y0 = ((iy % fy) + fy) % fy, y1 = (y0 + 1) % fy;
    const g = (a, b) => lat[(((b * 7 + c * 13) % L) * L + ((a * 3 + c * 29 + b * 11) % L)) * 4 + (c & 3)];
    return (g(x0, y0) * (1 - tx) + g(x1, y0) * tx) * (1 - ty) + (g(x0, y1) * (1 - tx) + g(x1, y1) * tx) * ty;
  };
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    if (yieldFn && (j & 3) === 0) await yieldFn();      // (every random draw is above, so yielding here changes nothing)
    for (let i = 0; i < N; i++) {
    const x = i / N, y = j / N, o = (j * N + i) * 4;
    const tear = 0.5 * vn(x, y, 7, 7, 0) + 0.28 * vn(x, y, 17, 17, 1) + 0.22 * vn(x, y, 41, 41, 2);
    const fibre = 0.55 * vn(x, y, 9, 61, 3) + 0.45 * vn(x, y, 53, 13, 4);
    const brush = 0.5 * vn(x, y, 3, 37, 5) + 0.3 * vn(x, y, 5, 59, 6) + 0.2 * vn(x, y, 11, 11, 7);
    const blotch = 0.6 * vn(x, y, 4, 4, 8) + 0.4 * vn(x, y, 9, 9, 9);
    data[o] = tear * 255; data[o + 1] = fibre * 255; data[o + 2] = brush * 255; data[o + 3] = blotch * 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// ---------- strip sheets ----------
// A sheet is lofted along a spine (local +Z, or +X with axis 'x'): S segments, K points across, half-width
// hw(t), cross-section an arc of `curl` radians (0 flat; > PI wraps into a tube centred on the spine) whose
// crown is on top (up = 1) or underneath (up = -1). aData = (paperU, paperV, edge, piece).
export function makeGeo() { return { pos: [], dat: [], col: [], idx: [], n: 0 }; }
export function strip(G, id, o) {
  const S = o.S, K = o.K, len = o.len, curl = o.curl ?? 0, up = o.up ?? 1, shift = o.shift ?? 0, org = o.org ?? [0, 0, 0];
  const hwRef = o.hwRef ?? Math.max(o.hw(0.25), o.hw(0.5), o.hw(0.75)), base = G.n;
  const uo = (id * 0.37 + (o.uvo ?? 0)) % 1, half = Math.min(curl / 2, Math.PI / 2), tearScale = o.tear ?? 1;
  for (let i = 0; i <= S; i++) {
    const t = i / S, hw = Math.max(o.hw(t), 0.0005), z = t * len * (o.zdir ?? 1), by = o.bend ? o.bend(t) : 0;
    for (let j = 0; j < K; j++) {
      const v = (j / (K - 1)) * 2 - 1, vs = v + shift;
      let x, y;
      if (curl < 0.05) { x = vs * hw; y = 0; } else {
        const R = hw / Math.sin(half), th = v * curl / 2;
        x = R * Math.sin(th) + shift * hw; y = up * (R * Math.cos(th) - (curl < Math.PI ? R * Math.cos(half) : 0));
      }
      y += by;
      if (o.axis === 'x') G.pos.push(org[0] + z, org[1] + y, org[2] + x); else G.pos.push(org[0] + x, org[1] + y, org[2] + z);
      let e = 1 - Math.abs(v);
      if (o.endA !== false) e = Math.min(e, (t * len) / hwRef);
      if (o.endB !== false) e = Math.min(e, ((1 - t) * len) / hwRef);
      e = e * tearScale + (1 - tearScale) * Math.min(1, e * 4);
      const arc = curl < 0.05 ? hw : (hw / Math.sin(half)) * (curl / 2);
      G.dat.push((v * arc) / 0.6 + uo, (t * len) / 0.6 + uo * 1.7, e, id);
      const c = o.col(t, v); G.col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < S; i++) for (let j = 0; j < K - 1; j++) {
    const a = base + i * K + j, b = a + 1, c = a + K, d = c + 1; G.idx.push(a, c, b, b, c, d);
  }
  G.n += (S + 1) * K;
}
export function finishGeo(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(G.dat, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
  g.setIndex(G.idx);
  return g;
}

// ---------- the paper pelican ----------
// Piece ids (posed in the vertex shader): 0 hull, 1 back, 2 tail, 3 right arm, 4 right hand, 5 left arm,
// 6 left hand, 7 lower neck, 8 upper neck, 9 head, 10 upper bill, 11 lower bill + pouch, 12/13 feet,
// 14 draining water strips, 15 wake strips. Bird space: +Z forward, +Y up, water line y = 0, 1.7 m long.
const DIM = { L1: 0.62, L2: 0.82, SH: [0.17, 0.4, 0.16], H1: [0, 0.4, 0.34], LN1: 0.36, LN2: 0.34, LH: 0.2, LB: 0.44 };
function buildPelicanGeometry(C, lod) {
  const G = makeGeo(), hi = !lod, sin = Math.sin, PI = Math.PI;
  const flat = (c) => () => c, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // hull: a boat of pink-flushed white, open on top
  strip(G, 0, { S: hi ? 6 : 4, K: hi ? 7 : 5, len: 0.97, org: [0, 0.22, -0.55], curl: 4.2, up: -1,
    hw: (t) => 0.25 * Math.pow(sin(PI * (0.07 + 0.88 * t)), 0.6), bend: (t) => 0.06 * (2 * t - 1) * (2 * t - 1),
    col: (t, v) => { const c = mixc(C.white, C.flush, 0.25 + 0.55 * (1 - Math.abs(v)) * (1 - 0.5 * t)); return C.breast ? c.lerp(C.breast, 0.8 * sm(0.42, 0.9, t) * (1 - 0.45 * Math.abs(v))) : c; }, tear: 0.6 });   // a pink flush on the breast
  // back sheet closing the hull
  strip(G, 1, { S: hi ? 5 : 3, K: hi ? 5 : 3, len: 0.86, org: [0, 0.3, -0.5], curl: 2.6, up: 1,
    hw: (t) => 0.235 * Math.pow(sin(PI * (0.09 + 0.85 * t)), 0.7), col: C.back ? flat(C.back) : (t) => mixc(C.white, C.cream, 0.5 * t) });
  // tail
  strip(G, 2, { S: 2, K: 3, len: 0.34, org: [0, 0.34, -0.46], zdir: -1, curl: 1.2, up: 1, endA: false,
    hw: (t) => 0.09 + 0.09 * t, bend: (t) => 0.1 * t, col: flat(C.tail ?? mixc(C.white, C.flush, 0.2)) });
  // wings: each piece is two papers, a white sheet in front and an ink sheet of flight feathers behind it
  for (const id of [3, 5]) {
    const Sa = hi ? 4 : 2, Sh = hi ? 4 : 3;
    strip(G, id, { S: Sa, K: 3, len: DIM.L1, axis: 'x', org: [0, -0.012, 0], shift: -1.25, curl: 0.3, up: 1, endA: false, endB: false,
      hw: (t) => 0.15 + 0.02 * sin(PI * t), col: flat(C.ink), uvo: 0.3, tear: 0.7 });
    strip(G, id, { S: Sa, K: 3, len: DIM.L1 + 0.03, axis: 'x', shift: 0.12, curl: 0.5, up: 1, endA: false, endB: false,
      hw: (t) => 0.165 + 0.02 * sin(PI * t), col: (t, v) => mixc(C.white, C.cream, 0.5 - 0.5 * v), tear: 0.7 });
    // a second, lilac shadow sheet slipped out under the folded wing (piece id + 0.25: the shader tucks it away as the wing opens)
    if (hi && C.shadow) strip(G, id + 0.25, { S: Sa, K: 3, len: DIM.L1 + 0.02, axis: 'x', org: [0, -0.006, 0], shift: -0.62, curl: 0.3, up: 1, endA: false, endB: false,
      hw: (t) => 0.2 + 0.015 * sin(PI * t), col: flat(C.shadow), uvo: 0.45, tear: 0.8 });
    strip(G, id + 1, { S: Sh, K: 3, len: DIM.L2, axis: 'x', org: [0, -0.012, 0], shift: -0.75, curl: 0.3, up: 1, endA: false,
      hw: (t) => 0.2 * (1 - 0.72 * t * t), col: flat(C.ink), uvo: 0.6, tear: 0.7 });
    strip(G, id + 1, { S: Sh, K: 3, len: DIM.L2 * 0.72, axis: 'x', shift: 0.55, curl: 0.4, up: 1, endA: false,
      hw: (t) => 0.1 * (1 - 0.8 * t), col: flat(C.white), tear: 0.7 });
  }
  // neck links: three-quarter tubes, seam at the back
  strip(G, 7, { S: hi ? 3 : 2, K: hi ? 5 : 4, len: DIM.LN1 + 0.03, curl: 4.7, up: -1, endA: false, endB: false,
    hw: (t) => 0.105 - 0.02 * t, col: (t) => mixc(C.breast ?? C.flush, C.white, 0.4 + 0.6 * t), tear: 0.4 });
  strip(G, 8, { S: hi ? 3 : 2, K: hi ? 5 : 4, len: DIM.LN2 + 0.03, curl: 4.7, up: -1, endA: false, endB: false,
    hw: (t) => 0.086 - 0.012 * t, col: flat(C.white), uvo: 0.2, tear: 0.4 });
  // head: white crown with a ragged crest end, pink face toward the bill, an ink smudge for the eye
  const Sh = hi ? 4 : 2, Kh = hi ? 5 : 4;
  strip(G, 9, { S: Sh, K: Kh, len: DIM.LH + 0.04, org: [0, 0, -0.04], curl: 4.9, up: 1, endB: false,
    hw: (t) => 0.072 + 0.036 * sin(PI * Math.min(1, t * 1.15)),
    col: (t) => (t > 0.6 ? C.face : mixc(C.white, C.face, t > 0.4 ? 0.5 : 0)), tear: 0.5 });      // (the eye is cut in the fragment shader)
  // upper bill: a straw strip with a yellow ridge down the middle and a red nail at the tip
  strip(G, 10, { S: hi ? 6 : 2, K: 3, len: DIM.LB, curl: 1.5, up: 1, endA: false, hwRef: 0.12,
    hw: (t) => 0.052 - 0.028 * t, col: (t, v) => (t > 0.85 ? (C.nail ?? C.pouch) : C.ridge && Math.abs(v) < 0.5 ? C.ridge : mixc(C.bill, C.face, 0.25 * (1 - t) + (C.ridge ? 0.2 : 0))), tear: 0.4 });
  // lower bill and pouch: a trough that the shader swells into a sagging sack
  strip(G, 11, { S: hi ? 4 : 2, K: hi ? 5 : 3, len: DIM.LB - 0.02, org: [0, -0.012, 0], curl: 3.5, up: -1, endA: false, hwRef: 0.12,
    hw: (t) => 0.044 - 0.024 * t, col: (t, v) => mixc(C.pouch, C.pouchDeep, 0.6 * Math.abs(v)), tear: 0.4 });
  if (hi) {
    for (const id of [12, 13]) strip(G, id, { S: 2, K: 3, len: 0.24, endA: false, hw: (t) => 0.022 + 0.06 * t, col: flat(C.pouchDeep), hwRef: 0.1, tear: 0.5 });
    // draining strips: x = side offset, y = -t (scaled by the drain length in the shader), z = place along the bill
    for (let k = 0; k < 3; k++) {
      const base = G.n, zA = 0.1 + 0.11 * k, xo = (k - 1) * 0.03, w = 0.022 - 0.004 * k, len = 1 - 0.22 * k;
      for (let i = 0; i <= 2; i++) for (let j = 0; j < 3; j++) {
        const t = i / 2, v = j - 1;
        G.pos.push(xo + v * w * (1 - 0.5 * t), -t * len, zA);
        G.dat.push(v * 0.05 + k * 0.31, t * 0.5 + k * 0.17, Math.min(1 - Math.abs(v), i === 2 ? 0 : 1), 14);
        G.col.push(C.white.r, C.white.g, C.white.b);
      }
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j; G.idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
      G.n += 9;
    }
    // wake: two torn white strips trailing in a V on the water
    for (const sx of [-1, 1]) {
      const base = G.n, S = 4;
      for (let i = 0; i <= S; i++) for (let j = 0; j < 3; j++) {
        const t = i / S, v = j - 1, hw = 0.02 + 0.06 * t, cx = sx * (0.22 + 0.5 * t), cz = 0.15 - 2.0 * t;
        G.pos.push(cx + v * hw * 0.96, 0.03, cz + v * hw * 0.28 * sx);
        G.dat.push(v * hw / 0.6 + (sx > 0 ? 0.43 : 0.11), t * 4.8, Math.min(1 - Math.abs(v), t * 6, (1 - t) * 3), 15);
        G.col.push(C.white.r, C.white.g, C.white.b);
      }
      for (let i = 0; i < S; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j; G.idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4); }
      G.n += (S + 1) * 3;
    }
  }
  return finishGeo(G);
}

// ---------- shared GLSL ----------
export const PAPER_GLSL = /* glsl */`
uniform sampler2D uPaper;
uniform vec3 uWhite, uTint, uHaze;
// Tears the rim (edge 0 at the rim .. 1 on the centre line), paints the deckle, streaks and fibre.
// puv is in tiles (0.6 m of paper per tile); tearAmp fades with distance; deckle 0 for shadow sheets.
vec4 paperSheet(vec3 col, vec2 puv, float edge, float tearAmp, float seed, float deckle) {
  float ang = fract(seed * 7.31) * 6.2832;
  vec2 ruv = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * puv;
  vec4 nA = texture2D(uPaper, puv * 0.9 + vec2(seed, seed * 1.7));
  vec4 nB = texture2D(uPaper, ruv * vec2(0.7, 0.7) + vec2(seed * 3.1, 0.37));
  float th = 0.05 + 0.46 * nA.r * tearAmp;
  float aa = fwidth(edge) + 1e-4;
  float alpha = clamp((edge - th) / aa + 0.5, 0.0, 1.0);
  float dk = (1.0 - smoothstep(th + 0.04, th + 0.13 + aa, edge)) * deckle;
  col *= 0.9 + 0.14 * nB.b + 0.08 * (nB.a - 0.5);
  col = mix(col, col * vec3(0.8, 0.85, 1.0), (1.0 - smoothstep(0.3, 0.62, nB.b)) * 0.55);   // cool watercolour streaks, never grey
  col *= 1.0 + 0.09 * (vec3(fract(seed * 3.7), fract(seed * 5.3), fract(seed * 9.1)) - 0.5);
  col += (nA.g - 0.5) * 0.05;
  col = mix(col, uWhite * (0.9 + 0.1 * nA.g), dk * 0.9);
  return vec4(col, alpha);
}
vec3 paperFar(vec3 col, float dist) { return max(mix(col, uHaze, 0.6 * clamp(dist / 900.0, 0.0, 1.0)) * uTint, vec3(0.0)); }
`;
export const ROT_GLSL = /* glsl */`
vec3 rX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }
vec3 rY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
vec3 rZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z); }
`;

const BIRD_VERT = /* glsl */`
attribute vec4 aData;
attribute vec3 color;
attribute vec4 iA, iB, iC;
uniform float uTime, uWave, uClose, uAlert, uSlip, uSunK;
uniform vec3 uShadowDir, uFlush, uDalPouch, uSunP;
varying vec3 vCol;
varying vec4 vData;
varying float vDist, vFlag, vUnder, vWy, vPid, vSun;
#ifdef FLY
uniform float uU, uGlide, uFlapRate, uHide;
uniform vec4 uLaunch;
uniform vec3 uNeck, uFoldTint, uHover;
attribute vec4 iD;   // a free flyer's own roll (x) and nose-up pitch (y), set by the world each frame (zero = level flight)
#endif
#include <fog_pars_vertex>
${ROT_GLSL}
float ss(float a, float b, float x) { return smoothstep(a, b, x); }
const vec3 SH = vec3(${DIM.SH.map((v) => v.toFixed(3)).join(',')});
const vec3 H1 = vec3(${DIM.H1.map((v) => v.toFixed(3)).join(',')});
const vec3 PIV = vec3(0.0, 0.05, 0.2);
void main() {
  float pid = aData.w, seed = iB.w;
  vec3 p = position, off = vec3(0.0);
  float a1, a2, a3, pitch, sweep, roll, liftA, fold, tipUp, swell, drain, kick, bob, gape, open;
  float LT = 0.0, unf = 1.0;
#if defined(FLY)
  // a free flyer: iA = (x, y, z, yaw) in the mesh's space, iB = (flap phase, launch u or -1, scale, seed).
  // Before its launch u the bird sits folded; after it the wings open and it runs and rises along its heading.
  float la = max(uU - iB.y, 0.0);
  unf = smoothstep(0.0, 0.006, la); LT = la * 40.0;
  float flapF = iC.w * uGlide * sin(uTime * uFlapRate + iB.x);
  a1 = mix(2.0, uNeck.x, unf); a2 = mix(1.0, uNeck.y, unf); a3 = mix(-0.62, uNeck.z, unf);
  pitch = -0.32 * unf * (1.0 - smoothstep(1.5, 5.0, LT));
  swell = 0.0; drain = 0.0; gape = 0.04; bob = 0.0;
  kick = 0.5 * sin(uTime * 15.0 + seed * 50.0) * unf * (1.0 - smoothstep(1.5, 3.5, LT));
  sweep = mix(1.47, 0.06, unf); roll = mix(1.2, 0.0, unf); fold = mix(2.95, 0.1, unf);
  liftA = unf * (0.1 + 0.55 * flapF); tipUp = unf * (0.14 + 0.5 * liftA); open = unf;
#elif defined(SOAR)
  float flap = iC.w * sin(uTime * 4.2 + seed * 31.0);
  a1 = 2.75; a2 = 0.15; a3 = -0.12; pitch = 0.0; swell = 0.0; drain = 0.0; kick = 0.0; gape = 0.0;
  sweep = 0.06 + 0.04 * sin(uTime * 0.7 + seed * 17.0); roll = 0.0; fold = 0.1;
  liftA = 0.1 + 0.06 * sin(uTime * 1.1 + seed * 40.0) + 0.45 * flap;
  tipUp = 0.14 + 0.5 * liftA; bob = 0.0; open = 1.0;
#else
  float f = fract(uWave - iB.y);
  float lift = ss(0.0, 0.06, f) * (1.0 - ss(0.14, 0.26, f)) + 0.5 * ss(0.42, 0.5, f) * (1.0 - ss(0.6, 0.8, f));
  float dip = ss(0.07, 0.19, f) * (1.0 - ss(0.40, 0.52, f));
  lift = max(lift, 0.55 * dip);
  float up = ss(0.44, 0.54, f) * (1.0 - ss(0.88, 0.99, f));
  float toss = ss(0.70, 0.78, f) * (1.0 - ss(0.84, 0.93, f));
  swell = ss(0.40, 0.46, f) * (1.0 - ss(0.76, 0.92, f));
  drain = ss(0.46, 0.50, f) * (1.0 - ss(0.60, 0.74, f));
  float calm = 1.0 - uAlert;   // an alarm stills the fishing: every head comes up
  lift *= calm; dip *= calm; up *= calm; toss *= calm; swell *= calm; drain *= calm;
  float idle = sin(uTime * 0.9 + seed * 20.0);
  a1 = 2.0 + 0.05 * idle; a2 = 1.0; a3 = -0.62 + 0.07 * idle;
  a1 = mix(a1, -0.15, dip); a2 = mix(a2, -0.5, dip); a3 = mix(a3, -0.75, dip);
  a1 = mix(a1, 1.75, up); a2 = mix(a2, 1.2, up); a3 = mix(a3, -0.28, up);
  a1 = mix(a1, 1.85, toss); a2 = mix(a2, 1.5, toss); a3 = mix(a3, 0.9, toss);
  pitch = dip * 0.95 - toss * 0.1;
  sweep = mix(1.47, 0.7, lift); roll = mix(1.2, 0.45, lift); liftA = lift * 0.65; fold = mix(2.95, 1.2, lift);
  tipUp = 0.0; gape = 0.05 + 0.1 * swell; open = lift;
  kick = 0.5 * sin(uTime * (5.0 + 6.0 * dip) + seed * 50.0);
  bob = 0.015 * sin(uTime * 1.7 + seed * 30.0) - 0.05 * dip;
#endif
  vec3 d1 = vec3(0.0, sin(a1), cos(a1)), d2 = vec3(0.0, sin(a2), cos(a2)), d3 = vec3(0.0, sin(a3), cos(a3));
  vec3 e1 = H1 + ${DIM.LN1.toFixed(3)} * d1, e2 = e1 + ${DIM.LN2.toFixed(3)} * d2, e3 = e2 + ${DIM.LH.toFixed(3)} * d3;
  if (pid < 2.5) {
  } else if (pid < 6.5) {
    float side = pid > 4.5 ? -1.0 : 1.0;
    if (fract(pid) > 0.1) p.z = mix(p.z, 0.03, open);   // the wing's shadow sheet shows only while the wing is folded (it closes to nothing as the wing opens)
    else if (p.z < 0.0) p.z *= mix(0.1, 1.0, open);   // flight feathers fan out from under the white coverts
    if (abs(pid - 4.0) < 0.5 || pid > 5.5) { p = rY(p, fold); p = rZ(p, tipUp); p.x += ${DIM.L1.toFixed(3)}; p.y -= 0.014; }
    p = rX(p, -roll); p = rY(p, sweep); p = rZ(p, liftA); p += SH; p.x *= side;
  } else if (pid < 7.5) { p = rX(p, -a1) + H1;
  } else if (pid < 8.5) { p = rX(p, -a2) + e1;
  } else if (pid < 9.5) { p = rX(p, -a3) + e2;
  } else if (pid < 10.5) { p = rX(p, -(a3 + gape)) + e3;
  } else if (pid < 11.5) {
    float b = sin(3.1416 * clamp(p.z / ${DIM.LB.toFixed(3)}, 0.0, 1.0));
    p.xy *= 1.0 + swell * 2.6 * b; p.y -= swell * 0.05 * b;
    p = rX(p, -(a3 - gape)) + e3;
  } else if (pid < 13.5) {
    float sx = pid < 12.5 ? 1.0 : -1.0;
    p = rX(p, 1.95 + kick * sx) + vec3(0.09 * sx, 0.03, -0.3);
  } else if (pid < 14.5) {
    off = vec3(p.x, p.y * drain * (0.45 + 0.25 * fract(seed * 13.0)), 0.0);
    p = rX(vec3(0.0, -0.05 - swell * 0.12, p.z), -a3) + e3;
  }
  if (pid < 14.5) { p = rX(p - PIV, pitch) + PIV; p.y += bob; p += off; }
  if (iC.x > 0.5 && pid > 13.5) p = vec3(0.0);
#if defined(FLY)
  if (pid > 13.5) p = vec3(0.0);
  p *= iB.z * mix(1.0, smoothstep(0.0, 0.02, la), uHide);
  p = rZ(p, uHover.z + iD.x);
  p = rX(p, -iD.y);
  p = rY(p, iA.w);
  vec2 fwd = vec2(sin(iA.w), cos(iA.w));
  float runD = uLaunch.x * LT * LT / (LT + 1.5), riseD = uLaunch.y * LT * LT / (LT + 2.5);
  p += iA.xyz + vec3(fwd.x * runD, riseD, fwd.y * runD);
  p.y += uHover.x * sin(uTime * 1.3 + seed * 40.0);
  p.xz += uHover.y * vec2(sin(uTime * 0.4 + seed * 20.0), cos(uTime * 0.33 + seed * 31.0));
#elif defined(SOAR)
  float ang = iA.z + uTime * iA.w, rad = iA.x + 1.2 * sin(uTime * 0.23 + seed * 11.0);
  vec3 ctrS = (modelMatrix * vec4(rad * cos(ang), iA.y, rad * sin(ang), 1.0)).xyz;
  p *= iB.z * (1.0 + 1.0 * clamp((distance(ctrS, cameraPosition) - 40.0) / 300.0, 0.0, 1.0));   // far birds are cut a little larger so they never thin out
  float dir = iA.w < 0.0 ? -1.0 : 1.0;
  p = rZ(p, dir * (0.38 + 0.1 * sin(uTime * 0.31 + seed * 9.0)));
  p = rY(p, -ang + (dir < 0.0 ? 3.14159 : 0.0));
  p += vec3(rad * cos(ang), iA.y + 1.0 * sin(uTime * 0.37 + seed * 23.0), rad * sin(ang));
#else
  p *= iB.z;
  p = rY(p, iB.x);
  vec2 xz = mix(iA.xy, iA.zw, uClose);
  p += vec3(xz.x, 0.0, xz.y);
#endif
  vec4 world = modelMatrix * vec4(p, 1.0);
  if (iC.x > 0.5) {   // the shadow sheet slips out sideways and always lies behind its bird, never over it
    vec3 vdir = normalize(world.xyz - cameraPosition + vec3(0.0, 1e-3, 0.0)), so = uShadowDir * uSlip * iB.z;
    so -= vdir * min(dot(so, vdir), 0.0);
    world.xyz += so + vdir * (0.04 + max(uSlip - 0.07, 0.0) * 3.0);   // a wider slip lies further back, so it never covers its own bird
  }
  vec3 c = color;
  if (pid < 2.5) c = mix(c, uFlush, iC.z * 0.35);
  if (iC.y > 0.5) { c *= vec3(0.78, 0.83, 0.9); if (abs(pid - 11.0) < 0.5) c = uDalPouch; }
#ifdef FLY
  c = mix(c * uFoldTint, c, unf);
#endif
  vCol = c; vFlag = iC.x; vWy = world.y; vPid = pid;
  // the sun in the cloud's eye lights whatever flies near it: strongest on the open wings, fading with distance
  vSun = uSunK * (1.0 - smoothstep(16.0, 105.0, distance(world.xyz, uSunP))) * (pid > 2.5 && pid < 6.5 ? 1.0 : 0.6);
  vData = vec4(aData.xy, aData.z, pid * 0.137 + seed);
  vUnder = step(cameraPosition.y + 2.0, world.y);
  vec4 mvPosition = viewMatrix * world;
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BIRD_FRAG = /* glsl */`
varying vec3 vCol;
varying vec4 vData;
varying float vDist, vFlag, vUnder, vWy, vPid, vSun;
uniform vec3 uShade, uUnder, uSunC;
uniform float uClipY;
#include <fog_pars_fragment>
${PAPER_GLSL}
void main() {
  bool cut = vWy < uClipY;   // under the clip line: decided here, thrown away below, once the last texture read and fwidth are made (a kept neighbour's are not defined after a pixel has left)
  float tearAmp = 1.0 - 0.8 * smoothstep(60.0, 400.0, vDist);
  vec3 col = mix(vCol, vCol * uUnder, vUnder);
  // close to the lens every sheet shows that it is painted paper: long brush streaks in two directions and fibre
  float nearK = 1.0 - smoothstep(5.0, 13.0, vDist), sd2 = fract(vData.w * 1.7);
  float b1 = texture2D(uPaper, vec2(vData.y * 0.42, vData.x * 0.5) + sd2).b;
  float b2 = texture2D(uPaper, vec2((vData.x + vData.y * 0.6) * 0.5, (vData.y - vData.x * 0.6) * 0.62) + sd2 * 3.0 + 0.4).b;
  float fib = texture2D(uPaper, vData.xy * 2.3 + sd2).g;
  col = mix(col, col * vec3(0.7, 0.75, 1.0), nearK * (1.0 - smoothstep(0.36, 0.52, b1)));
  col = mix(col, col * vec3(1.0, 0.78, 0.83), nearK * 0.85 * (1.0 - smoothstep(0.37, 0.5, b2)));
  col *= 1.0 + nearK * 0.12 * (fib - 0.5);
  // the eye: a dark paper dot in a pale ring on each side of the head (piece 9, placed in the head sheet's own paper metres)
  float headK = 1.0 - step(0.3, abs(vPid - 9.0));
  float er = length((vec2(abs(vData.x - 0.33), vData.y - 0.561) - vec2(0.218, 0.2)) / 0.047);
  col = mix(col, uWhite, headK * (1.0 - smoothstep(1.3, 1.5, er)));
  col = mix(col, vec3(0.03, 0.05, 0.13), headK * (1.0 - smoothstep(0.82, 1.0, er)));
  vec4 s = paperSheet(col, vData.xy, vData.z, tearAmp, vData.w, 1.0 - vFlag);
  if (cut) discard;
  s.rgb = mix(s.rgb, s.rgb * uSunC * 1.2 + uSunC * 0.05, vSun);          // warm paper where the sun's rays fall
  s.rgb = mix(s.rgb, uShade * (0.96 + 0.08 * fract(vData.w * 3.3)), vFlag);
  if (s.a < 0.04) discard;
  gl_FragColor = vec4(paperFar(s.rgb, vDist), s.a);
  #include <fog_fragment>
}`;

export function paperMaterial(shared, extra, vert, frag, defines = {}, params = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...extra },
    vertexShader: vert, fragmentShader: frag, defines, fog: true, side: THREE.DoubleSide, alphaToCoverage: true, ...params,
  });
}

// the horseshoe: s = 0 at the left (-X) tip, 0.5 at the back, 1 at the right tip; half-width a, mouth at z = zm
function horseshoePoint(s, a, depth, zm, skew) {
  const th = Math.PI * s, c = Math.cos(th), sn = Math.sin(th);
  const x = -a * Math.sign(c) * Math.pow(Math.abs(c), 0.72) + skew * sn * sn;
  return [x, zm - depth * Math.pow(sn, 0.85)];
}

export function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = count;
  return g;
}

// ---------- the stand-off of the leaping fish ----------
// Each leaping fish is kept off the lens by the place of its BOX (everywhere its sheet can be about its anchor for any hash, heading and
// clock): the box gets 2.0 m of clear air from the camera's whole line. f = { x, z, h, slabs, skin, keep }: the box is the square of half
// side h about (x, z), swollen in plan by rho from y0 to y1 for each slab [rho, y0, y1]; skin, the sheet's far corner; keep, its dealing's
// distance from a fisher; own = [x, z, d], if it has one: a place its dealing keeps it d from, kept by a moved fish as well.
// line = { path, PT (its table), fishers (closed places), centre, inArc }. A point c of the line holds the anchor
// out of its reach: that square about c, swollen by rho and by what of 2.0 + skin the height between c and the slab leaves; the whole line
// is looked at (the table, and the route by thirds wherever the table comes within a piece of the reach).
// 1. A fish inside a reach is slid straight away from the point it is deepest inside by the least that clears it (halving, the clear end
//    kept, in single precision), the line looked at again: 12 turns at most.
// 2. A fish with no room there (still short, or put out of the arc it was dealt in, or nearer a fisher than keep) is carried across from
//    its dealt spot: from the line's nearest place, square to it toward the centre's side, to the first place off the fishers, clear, and
//    in the arc if it was dealt there (a walk by the table's piece no further than the centre, then 12 halvings). If another fish's spot
//    lies there under the greater of the two sheets (two would leap as one) it takes the like place of the nearest free piece along the
//    line, at most 12 m on: the law's own bound, so that the search ends (the designer's 12 m for a slide along the row, taken for this
//    one too; on forty seeds no fish is slid on further than 8.3 m). With no place square to the line, the least straight toward the centre.
// No draw is made. Returns the counts: side, across (on: of those, slid on along the line), and pair, short, which must be 0.
export async function standOff(line, fish, pause) {
  const { path, PT, fishers, centre, inArc } = line, piece = path.length / (PT.length - 1), p = new THREE.Vector3(), q = new THREE.Vector3(), fr = Math.fround;
  const tally = { side: 0, across: 0, on: 0, pair: 0, short: 0 }, todo = [];
  let f, need, reach, home;
  const set = (o) => { f = o; need = 2.0 + f.skin; reach = Math.max(...f.slabs.map((s) => s[0])) + need; home = inArc(f.x, f.z); };
  // how far (x, z) stands outside the reach of the line's point c (under 0: inside it)
  const out = (c, x, z) => {
    const ex = Math.abs(c.x - x) - f.h, ez = Math.abs(c.z - z) - f.h; let g = Infinity;
    if (ex > reach + piece || ez > reach + piece) return g;
    const sd = Math.hypot(Math.max(ex, 0), Math.max(ez, 0)) + Math.min(Math.max(ex, ez), 0);
    for (const s of f.slabs) { const dv = Math.max(s[1] - c.y, c.y - s[2], 0); if (dv < need) g = Math.min(g, sd - s[0] - Math.sqrt(need * need - dv * dv)); }
    return g;
  };
  // the least of it over the whole line, q the point where (sign: only whether it is under 0, told at the first point of the table that is)
  const gap = (x, z, sign) => {
    let g = Infinity, f0 = Infinity, f1 = out(PT[0], x, z);
    for (let k = 0; k < PT.length; k++) {
      if (sign && f1 < 0) return f1;
      const f2 = k + 1 < PT.length ? out(PT[k + 1], x, z) : Infinity;
      if (f1 <= f0 && f1 <= f2 && f1 < need + piece) {
        let lo = Math.max(k - 1, 0) * piece, hi = Math.min(k + 1, PT.length - 1) * piece;
        for (let n = 0; n < 30; n++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (out(path.posAtDist(a, p), x, z) < out(path.posAtDist(b, p), x, z)) hi = b; else lo = a; }
        const v = out(path.posAtDist((lo + hi) / 2, p), x, z); if (v < g) { g = v; q.copy(p); }
      }
      f0 = f1; f1 = f2;
    }
    return g;
  };
  const fits = (x, z) => (inArc(x, z) || !home) && fishers.every((b) => Math.hypot(b[0] - x, b[1] - z) >= f.keep) && !(f.own && Math.hypot(f.own[0] - x, f.own[1] - z) < f.own[2]);
  const ok = (x, z) => fits(x, z) && gap(x, z, 1) >= 0;
  // no other fish's spot within the greater of the two sheets, less slack (a fish still waiting to be carried has no spot yet)
  const apart = (x, z, slack = 0) => fish.every((o) => o === f || o.wait || Math.hypot(o.x - x, o.z - z) >= Math.max(f.skin, o.skin) - slack);
  // the first place that holds, from (ax, az) along (dx, dz) as far as lim (alone: given up once no place still open can be apart); the
  // build is handed back before each look at the line
  const walk = async (test, ax, az, dx, dz, lim, alone) => {
    for (let t = 0; t <= lim; t += piece) {
      if (pause) await pause();
      if (!test(fr(ax + dx * t), fr(az + dz * t))) continue;
      let lo = Math.max(t - piece, 0), hi = t;
      for (let n = 0; n < 12 && lo < hi; n++) {
        if (alone && !apart(fr(ax + dx * hi), fr(az + dz * hi), hi - lo)) return null;
        if (pause) await pause();
        const m = (lo + hi) / 2; if (test(fr(ax + dx * m), fr(az + dz * m))) hi = m; else lo = m;
      }
      return [fr(ax + dx * hi), fr(az + dz * hi)];
    }
    return null;
  };
  const square = (m, alone) => {                  // from the line's place at metre m, square to it toward the centre's side
    path.posAtDist(m, p); const ax = p.x, az = p.z, cx = centre[0] - ax, cz = centre[1] - az; path.tangentAtDist(m, p);
    const l = Math.hypot(p.x, p.z) * (p.x * cz - p.z * cx < 0 ? -1 : 1);
    return walk(ok, ax, az, -p.z / l, p.x / l, Math.hypot(cx, cz), alone);
  };
  for (const o of fish) {
    set(o);
    let x = fr(f.x), z = fr(f.z), g = gap(x, z), turn = 0;
    for (; g < 0 && turn < 12; turn++) {
      let nx = x - q.x, nz = z - q.z; const nl = Math.hypot(nx, nz); if (nl > 0) { nx /= nl; nz /= nl; } else nx = 1;
      let lo = 0, hi = 2 * (f.h + reach) * Math.SQRT2;      // (far enough to be out of that point's reach whichever way)
      for (let n = 0; n < 40; n++) { const t = (lo + hi) / 2; if (out(q, fr(x + nx * t), fr(z + nz * t)) >= 0) hi = t; else lo = t; }
      x = fr(x + nx * hi); z = fr(z + nz * hi); g = gap(x, z);
    }
    if (turn) { if (g >= 0 && fits(x, z)) { f.x = x; f.z = z; tally.side++; } else { f.wait = 1; todo.push(f); } }
    if (pause) await pause();
  }
  for (const o of todo) {
    set(o);
    const x0 = fr(f.x), z0 = fr(f.z); let m0 = 0, best = Infinity;
    for (let k = 1; k < PT.length; k++) {         // the line's nearest place to the dealt spot in plan, on the table's pieces
      const a = PT[k - 1], ex = PT[k].x - a.x, ez = PT[k].z - a.z, t = Math.min(1, Math.max(0, ((x0 - a.x) * ex + (z0 - a.z) * ez) / (ex * ex + ez * ez))), d = Math.hypot(a.x + ex * t - x0, a.z + ez * t - z0);
      if (d < best) { best = d; m0 = (k - 1 + t) * piece; }
    }
    let r = await square(m0);
    if (r && !apart(r[0], r[1])) {
      let s = null;
      for (let j = 1; j * piece <= 12 && !s; j++) for (const w of [j, -j]) { const c = await square(m0 + w * piece, 1); if (c && apart(c[0], c[1])) { s = c; break; } }
      if (s) { r = s; tally.on++; } else tally.pair++;
    }
    if (!r) { const dx = centre[0] - x0, dz = centre[1] - z0, d = Math.hypot(dx, dz); r = await walk((x, z) => ok(x, z) && apart(x, z), x0, z0, dx / d, dz / d, d); }
    if (r) { f.x = r[0]; f.z = r[1]; tally.across++; } else tally.short++;
    f.wait = 0;
    if (pause) await pause();
  }
  return tally;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('pelican-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette ?? DEFAULT_PALETTE).map(lin);
  while (pal.length < 7) pal.push(lin(DEFAULT_PALETTE[pal.length]));
  const HOURS = {
    morning: { tint: [1, 1, 1], shade: '#B9B2DC' }, dawn: { tint: [1.0, 0.9, 0.93], shade: '#C9A6D2' },
    evening: { tint: [1.0, 0.88, 0.72], shade: '#9A86C8' }, dusk: { tint: [0.6, 0.7, 0.96], shade: '#6A70B4' },
  };
  const hour = HOURS[opts.hour] ?? HOURS.morning;
  const lilac = lin(hour.shade), pink = mixc(pal[1], lin('#F29BB8'), 0.6);
  const C = {
    white: pal[0].clone().multiplyScalar(0.85), ink: mixc(pal[5].clone().multiplyScalar(0.3), lin('#16264A'), 0.55),
    face: mixc(pal[1], lin('#F08CA8'), 0.5).multiplyScalar(0.92), bill: pal[4].clone().multiplyScalar(0.92),
    pouch: pal[1].clone().multiplyScalar(0.95), pouchDeep: mixc(pal[1], lin('#E8703A'), 0.55).multiplyScalar(0.9),
  };
  C.cream = mixc(C.white, pal[4], 0.1); C.flush = mixc(C.white, pink, 0.3 + 0.15 * rng());
  // the pelicans' own close-up colours (flocks that bring their own colour set do not inherit them)
  C.breast = mixc(C.white, pink, 0.6); C.ridge = lin('#F2CF3C').multiplyScalar(0.9); C.nail = lin('#E04A30').multiplyScalar(0.9);
  C.shadow = mixc(lilac, pal[2], 0.22).multiplyScalar(0.84);
  const shadowDir = new THREE.Vector3(...(opts.shadowDir ?? [-0.8, -0.25, -0.6])).normalize();
  const paper = await makePaperAtlas(rng.fork ? rng.fork('paper') : rng, ctx.yield ? () => ctx.yield() : null);
  const U = {                                   // uniforms shared by every material of the piece
    uPaper: { value: paper }, uTime: { value: 0 }, uWave: { value: 0 }, uClose: { value: 0 }, uAlert: { value: 0 },
    uWhite: { value: C.white.clone() }, uTint: { value: new THREE.Color(...hour.tint) },
    uHaze: { value: lin('#E6F6EC').multiplyScalar(0.85) }, uShadowDir: { value: shadowDir },
    uShade: { value: mixc(lilac, pal[2], 0.22).multiplyScalar(0.82) },
    uUnder: { value: mixc(new THREE.Color(1, 1, 1), lilac, 0.6) },
    // the sun the world may hang in the cloud's eye: its place, its colour, and how strongly it lights the birds (0 = none)
    uSunP: { value: new THREE.Vector3(0, 115, -195) }, uSunC: { value: new THREE.Color(1, 0.84, 0.56) }, uSunK: { value: 0 },
  };
  const object = new THREE.Group(); object.name = 'pelican-collage-hero';
  await ctx.yield?.();

  // ---- layout of the horseshoe (open and closed) ----
  const gale = opts.weather === 'gale';
  const A0 = gale ? 18 : 22, A1 = gale ? 12 : 15, depth = rng.range(37, 42), ZM = 20, skew = rng.range(-3.5, 3.5);
  const nF = Math.max(8, Math.round(opts.fishers ?? 60));
  const table = []; { let L = 0, prev = horseshoePoint(0, A0, depth, ZM, skew); table.push(0);
    for (let i = 1; i <= 400; i++) { const q = horseshoePoint(i / 400, A0, depth, ZM, skew); L += Math.hypot(q[0] - prev[0], q[1] - prev[1]); table.push(L); prev = q; } }
  const sAtArc = (f) => { const want = f * table[400]; let i = 1; while (i < 400 && table[i] < want) i++; return (i - (table[i] - want) / Math.max(1e-6, table[i] - table[i - 1])) / 400; };
  const nDal = opts.dalmatian != null ? Math.round(nF * opts.dalmatian) : rng.int(0, 3);
  const birds = [];
  for (let i = 0; i < nF; i++) {
    const f = (i + 0.5 + rng.range(-0.22, 0.22)) / nF, s = sAtArc(f), arm = Math.abs(Math.cos(Math.PI * s));
    const row = ((i % 2) * 2 - 1) * 0.85 * arm + rng.range(-0.3, 0.3);
    const place = (a, dep) => {
      const q = horseshoePoint(s, a, dep, ZM, skew), cx = skew * 0.5, cz = ZM - dep * 0.45;
      let nx = cx - q[0], nz = cz - q[1]; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      return { x: q[0] - nx * row, z: q[1] - nz * row, nx, nz };
    };
    const o = place(A0, depth), c = place(A1, depth * 0.94);
    const hx = o.nx * 0.8 * arm, hz = 1 + o.nz * 0.8 * arm;
    birds.push({ f, s, o, c, yaw: Math.atan2(hx, hz) + rng.range(-0.16, 0.16), phase: (opts.waveLength ? f * table[400] / opts.waveLength : 0.5 * f) + 0.1 + rng.range(-0.02, 0.02),
      scale: rng.range(0.92, 1.1) * (s < 0.36 ? 1.09 : 1), seed: rng(), dal: 0, flush: rng() });
  }
  for (let k = 0; k < nDal; k++) birds[rng.int(0, nF - 1)].dal = 1;
  // a vanguard the world may ask for (opts.joiners: [{ x, z, cx, cz, yaw, scale }]): fishers ahead of the mouth that
  // close up as the horseshoe closes. They take the same dip cycle; hero.setPhase(index, phase) times each one.
  const nCore = birds.length;
  for (const j of opts.joiners ?? []) birds.push({ f: 0, s: 2, o: { x: j.x, z: j.z, nx: 0, nz: 0 }, c: { x: j.cx ?? j.x, z: j.cz ?? j.z, nx: 0, nz: 0 },
    yaw: j.yaw ?? 0, phase: j.phase ?? 0.1, scale: j.scale ?? 1.05, seed: j.seed ?? rng(), dal: 0, flush: j.flush ?? rng(), joiner: true });

  // ---- the fly-through line, the thermal and the portal seat ----
  const leftX = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= 100; i++) { const q = horseshoePoint(i / 200, A1, depth * 0.94, ZM, skew); const d = Math.abs(q[1] - z); if (d < bd) { bd = d; best = q[0]; } } return best; };
  const col = new THREE.Vector3(...(opts.columnOffset ?? [30, 0, -195]));
  const TOP = 115, seat = col.clone().add(new THREE.Vector3(0, TOP, 0));
  U.uSunP.value.copy(seat);
  const P5 = new THREE.Vector3(14 + skew * 0.5, 4.2, ZM - depth - 1.5);
  const toCol = new THREE.Vector2(col.x - P5.x, col.z - P5.z).normalize();
  const rot2 = (v, a) => new THREE.Vector2(v.x * Math.cos(a) - v.y * Math.sin(a), v.x * Math.sin(a) + v.y * Math.cos(a));
  const hEnd = rot2(toCol, -0.42), hPrev = rot2(toCol, 0.32);     // curving left (toward -X when heading -Z)
  const dirEnd = new THREE.Vector3(hEnd.x * Math.SQRT1_2, Math.SQRT1_2, hEnd.y * Math.SQRT1_2);
  const approachStart = seat.clone().addScaledVector(dirEnd, -60);
  const Bp = approachStart.clone().sub(new THREE.Vector3(hPrev.x * 57, 33, hPrev.y * 57));
  const midC = Bp.clone().lerp(approachStart, 0.55).add(new THREE.Vector3(hPrev.x * 3 - hEnd.x * 3, -1.5, hPrev.y * 3 - hEnd.y * 3));
  // the low pass hugs the inside of the horseshoe: 3.5 m inside the left arm, round the back-left bend with the
  // birds (which face the mouth) turned toward the lens, then up over the back row toward the thermal
  const shapeC = (s) => horseshoePoint(s, A1, depth * 0.94, ZM, skew);
  const inset = (s, d, y) => { const q = shapeC(s), cx = skew * 0.5, cz = ZM - depth * 0.94 * 0.45; let nx = cx - q[0], nz = cz - q[1]; const nl = Math.hypot(nx, nz) || 1; return new THREE.Vector3(q[0] + nx / nl * d, y, q[1] + nz / nl * d); };
  const sAtZ = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= 100; i++) { const d = Math.abs(shapeC(i / 200)[1] - z); if (d < bd) { bd = d; best = i / 200; } } return best; };
  P5.copy(inset(0.585, -2.2, 4.4));
  const flyPts = [
    new THREE.Vector3(leftX(20) + 5.6, 2.6, ZM + 21), new THREE.Vector3(leftX(20) + 4.3, 1.0, ZM + 5), inset(sAtZ(13), 3.3, 0.64), inset(sAtZ(4), 3.2, 0.6),
    inset(sAtZ(-4), 3.3, 0.6), inset(sAtZ(-11), 3.8, 0.64), inset(0.43, 4.4, 0.9), P5,
    P5.clone().add(new THREE.Vector3(4.6, 3.4, -8.5)),
    P5.clone().lerp(Bp, 0.5).add(new THREE.Vector3(0, -3, 0)), Bp, midC, approachStart, seat.clone(),
  ];
  const flyCurve = new THREE.CatmullRomCurve3(flyPts, false, 'centripetal');
  const flySamples = flyCurve.getSpacedPoints(260);
  await ctx.yield?.();
  // fishers keep 3 m off the low part of the line (birds are pushed outward if a seed crowds it)
  let clearF = 1e9;
  for (const b of birds) for (const k of ['o', 'c']) {
    const q = b[k];
    for (let it = 0; it < 4; it++) {
      let md = 1e9, mp = null;
      for (const sp of flySamples) { if (sp.y > 7) break; const d = Math.hypot(sp.x - q.x, sp.z - q.z, Math.max(0, sp.y - 1.3)); if (d < md) { md = d; mp = sp; } }
      if (md >= 3.05 || !mp) { clearF = Math.min(clearF, md); break; }
      const hx = q.x - mp.x, hz = q.z - mp.z, hl = Math.hypot(hx, hz), k2 = (3.2 - md) / Math.max(hl, 0.3);
      if (hl < 0.05) { q.x += 3.2 - md; } else { q.x += hx * k2; q.z += hz * k2; }
    }
  }
  await ctx.yield?.();
  const nS = Math.max(40, Math.round(opts.soarers ?? 240 * detail));
  const rhoY = flySamples.map((sp) => [Math.hypot(sp.x - col.x, sp.z - col.z), sp.y]);
  const sense = rng.sign(), soar = []; let clearS = 1e9;
  for (let i = 0; i < nS; i++) {
    if ((i & 15) === 15) await ctx.yield?.();
    let r = 20, y = 60, md = 0;
    for (let tries = 0; tries < 40; tries++) {
      if (i % 5 === 4) { y = rng.range(20, 80); r = rng.range(34, 36 + (82 - y) * 0.85); }
      else { y = 15 + 113 * Math.pow(rng(), 0.9); r = rng.range(11, 24 + 10 * Math.sin(Math.PI * Math.min(1, (y - 15) / 113))); }
      md = 1e9; for (const q of rhoY) md = Math.min(md, Math.hypot(q[0] - r, q[1] - y));
      if (md > 8.5) break;
    }
    if (md <= 8.5) continue;
    clearS = Math.min(clearS, md - 2.2);
    const strand = i % 5, v = rng.range(8, 11.5);
    soar.push({ r, y, a0: strand * TAU / 5 + sense * y * 0.05 + rng.range(-0.5, 0.5), w: sense * v / r, scale: rng.range(0.9, 1.12), seed: rng(),
      flap: rng.chance(0.14) ? rng.range(0.5, 1) : 0, flush: rng() });
  }
  await ctx.yield?.();

  // ---- fishers (each drawn twice: the bird and its lilac shadow sheet) ----
  const birdU = { uFlush: { value: mixc(C.white, pink, 0.6) }, uDalPouch: { value: lin('#F0683A').multiplyScalar(0.9) } };
  {
    const base = buildPelicanGeometry(C, false), n = birds.length * 2;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
    birds.forEach((b, i) => { for (const sh of [0, 1]) { const o = (i + sh * birds.length) * 4;
      iA.set([b.o.x, b.o.z, b.c.x, b.c.z], o); iB.set([b.yaw, b.phase, b.scale, b.seed], o); iC.set([sh, b.dal, b.flush, 0], o); } });
    const mesh = new THREE.Mesh(instanced(base, n, { iA, iB, iC }), paperMaterial(U, { ...birdU, uClipY: { value: -0.02 }, uSlip: { value: 0.07 } }, BIRD_VERT, BIRD_FRAG));
    mesh.frustumCulled = false; mesh.name = 'fishers'; object.add(mesh); mesh.userData.iB = iB; mesh.userData.iA = iA;
  }
  await ctx.yield?.();
  // ---- soarers in the thermal ----
  {
    const base = buildPelicanGeometry(C, true), n = soar.length;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
    soar.forEach((b, i) => { iA.set([b.r, b.y, b.a0, b.w], i * 4); iB.set([0, 0, b.scale, b.seed], i * 4); iC.set([0, 0, b.flush, b.flap], i * 4); });
    const mesh = new THREE.Mesh(instanced(base, n, { iA, iB, iC }), paperMaterial(U, { ...birdU, uClipY: { value: -1e6 }, uSlip: { value: 0.07 } }, BIRD_VERT, BIRD_FRAG, { SOAR: 1 }));
    mesh.position.copy(col); mesh.frustumCulled = false; mesh.name = 'soarers'; object.add(mesh);
  }
  await ctx.yield?.();

  // ---- torn white rings pinned to the sliding water, and the birds' shadow sheets on it ----
  {
    const base = new THREE.PlaneGeometry(1, 1), n = birds.length * 3;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
    birds.forEach((b, i) => { for (let k = 0; k < 3; k++) { const o = (i * 3 + k) * 4;
      iA.set([b.o.x, b.o.z, b.c.x, b.c.z], o); iB.set([b.yaw, b.phase, b.scale, b.seed], o); iC.set([k, 0, 0, 0], o); } });
    const mat = paperMaterial(U, {}, /* glsl */`
      attribute vec4 iA, iB, iC;
      uniform float uWave, uClose; uniform vec3 uShadowDir;
      varying vec2 vQ, vW; varying vec4 vP; varying float vDist;
      #include <fog_pars_vertex>
      void main() {
        vec2 xz = mix(iA.xy, iA.zw, uClose), q = position.xy, ctr; float kind = iC.x, R = 1.0, fade = 0.0, half2;
        vec2 fw = vec2(sin(iB.x), cos(iB.x));
        if (kind < 1.5) {
          float age = (fract(uWave - iB.y - 0.13) + kind) * 3.0;
          R = 0.35 + 0.75 * sqrt(age); fade = age / 6.0; half2 = R * 1.25 + 0.3;
          ctr = xz + fw * 0.95 * iB.z + vec2(0.0, -0.8 * age);
        } else {
          half2 = 1.5 * iB.z; ctr = xz + uShadowDir.xz * 0.5 * iB.z;
          q = vec2(q.x * fw.y + q.y * fw.x, -q.x * fw.x + q.y * fw.y);
        }
        vQ = position.xy * 2.0 * half2; vP = vec4(R, fade, kind, iB.w);
        vec4 world = modelMatrix * vec4(ctr.x + q.x * 2.0 * half2, 0.035 + 0.004 * kind, ctr.y + q.y * 2.0 * half2, 1.0);
        vW = world.xz;
        vec4 mvPosition = viewMatrix * world; vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec2 vQ, vW; varying vec4 vP; varying float vDist;
      uniform vec3 uShade, uShadowDir;
      #include <fog_pars_fragment>
      ${PAPER_GLSL}
      void main() {
        float n = texture2D(uPaper, vW * 0.21 + vP.w).r, n2 = texture2D(uPaper, vW * 0.83 + vP.w * 2.0).r;
        vec3 col; float a;
        if (vP.z < 1.5) {
          float w = 0.09 + 0.1 * (1.0 - vP.y), Rr = vP.x * (0.88 + 0.24 * n), th = 0.12 + 0.5 * n2 + vP.y * vP.y * 0.95;
          float band = 1.0 - abs(length(vQ) - Rr) / w, band2 = 1.0 - abs(length(vQ - uShadowDir.xz * 0.07) - Rr) / w;
          float aa = fwidth(band) + 1e-3;
          float a1 = smoothstep(th - aa, th + aa, band), a2 = smoothstep(th - aa, th + aa, band2) * 0.75;
          col = mix(uShade, uWhite * (0.92 + 0.08 * n2), a1); a = max(a1, a2) * (1.0 - smoothstep(0.85, 1.0, vP.y));
        } else {
          float d = length(vQ / (vec2(0.62, 1.15) * 1.0)) + (n2 - 0.5) * 0.35;
          col = uShade; a = (1.0 - smoothstep(0.7, 1.0, d)) * 0.8;
        }
        if (a < 0.01) discard;
        gl_FragColor = vec4(paperFar(col, vDist), a);
        #include <fog_fragment>
      }`, {}, { transparent: true, depthWrite: false, alphaToCoverage: false });
    const mesh = new THREE.Mesh(instanced(base, n, { iA, iB, iC }), mat);
    mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'rings'; object.add(mesh); mesh.userData.iB = iB; mesh.userData.iA = iA;
  }

  // ---- scraps: silver fish jumping inside the arc (mode 0) and white down rising in the thermal (mode 1) ----
  {
    const nFish = Math.round(320 * detail), nDown = Math.round(170 * detail), n = nFish + nDown;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    for (let i = 0; i < nFish; i++) {
      const s = rng.range(0.12, 0.88), q = horseshoePoint(s, A1 * rng.range(0, 0.7), depth * rng.range(0.25, 0.8), ZM, skew);
      iA.set([q[0], q[1] + rng.range(-3, 6), rng(), rng.range(1.3, 3.2)], i * 4); iB.set([rng.range(0.28, 0.5), 0, rng(), rng.range(0.4, 1.2)], i * 4);
    }
    for (let i = nFish; i < n; i++) {
      iA.set([rng.range(1, 13) + (i % 3 === 0 ? rng.range(0, 30) : 0), 0, rng(), rng.range(22, 40)], i * 4); iB.set([rng.range(0.16, 0.34), 1, rng(), 0], i * 4);
    }
    const mat = paperMaterial(U, { uCol: { value: col.clone() }, uFishA: { value: mixc(C.white, pal[2], 0.45) }, uFishB: { value: mixc(C.white, pal[6], 0.5) } }, /* glsl */`
      attribute vec4 iA, iB;
      uniform float uTime; uniform vec3 uCol;
      varying vec2 vQ; varying vec3 vP; varying float vDist, vNear;
      #include <fog_pars_vertex>
      void main() {
        float seed = iB.z, size = iB.x; vec3 c, T, W; vNear = 1.0;
        if (iB.y < 0.5) {
          float tt = uTime / iA.w + iA.z, q = fract(tt), cyc = floor(tt);
          float h1 = fract(sin(cyc * 12.9898 + seed * 78.233) * 43758.5453);
          vec2 base = iA.xy + (vec2(h1, fract(h1 * 7.13)) - 0.5) * 6.0;
          float j = q / 0.4, air = step(j, 1.0), da = seed * 6.2832 + cyc * 2.4;
          vec2 d = vec2(cos(da), sin(da));
          c = vec3(base.x + d.x * j * 1.4, air * iB.w * 4.0 * j * (1.0 - j) - (1.0 - air) * 0.6 - 0.04, base.y + d.y * j * 1.4);
          float pa = atan(iB.w * 4.0 * (1.0 - 2.0 * j) / 1.4), sp = uTime * 8.0 + seed * 40.0;
          T = vec3(d.x * cos(pa), sin(pa), d.y * cos(pa)); vec3 Nn = vec3(-d.y, 0.0, d.x), Bn = cross(T, Nn);
          W = (Nn * cos(sp) + Bn * sin(sp)) * 0.42;
        } else {
          float q = fract(iA.z + uTime / iA.w), ang = seed * 6.2832 + uTime * 0.22 * (0.5 + fract(seed * 5.0));
          c = uCol + vec3(iA.x * cos(ang), 13.0 + q * 114.0, iA.x * sin(ang)) + 0.6 * vec3(sin(uTime * 0.9 + seed * 30.0), 0.0, cos(uTime * 0.7 + seed * 50.0));
          size *= smoothstep(0.0, 0.05, q) * (1.0 - smoothstep(0.93, 1.0, q));
          // the down is a medium we fly through, so it takes the near law of the world's own down (the kit's makeParticles form): by the true
          // distance of its middle from the lens, on its alpha alone, with the same two figures, 0.6 m and 2.5 m, of the kit's petals preset
          vNear = smoothstep(0.6, 2.5, length((viewMatrix * modelMatrix * vec4(c, 1.0)).xyz));
          float s1 = uTime * 1.3 + seed * 60.0, s2 = uTime * 0.8 + seed * 20.0;
          T = normalize(vec3(cos(s1), 0.5 * sin(s1 * 1.3), sin(s1)));
          W = cross(T, vec3(sin(s2), cos(s2), 0.35)); W *= 0.5 / max(length(W), 1e-3);
        }
        vec4 world = modelMatrix * vec4(c + (T * position.x + W * position.y) * size, 1.0);
        vQ = position.xy; vP = vec3(iB.y, seed, size);
        vec4 mvPosition = viewMatrix * world; vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec2 vQ; varying vec3 vP; varying float vDist, vNear;
      uniform vec3 uFishA, uFishB;
      #include <fog_pars_fragment>
      ${PAPER_GLSL}
      void main() {
        float prof = 0.12 + 0.88 * pow(max(sin(3.1416 * clamp(vQ.x + 0.5, 0.0, 1.0)), 0.0), 0.6);
        float e = vP.x < 0.5 ? 1.0 - abs(vQ.y) * 2.0 / prof : 1.0 - length(vQ * vec2(2.0, 2.6));
        vec3 col = vP.x < 0.5 ? mix(uWhite, fract(vP.y * 9.0) < 0.2 ? uFishB : uFishA, step(0.08, vQ.y)) : uWhite;
        vec4 s = paperSheet(col, vQ * vP.z * vec2(1.6, 0.8) + vP.y, clamp(e, 0.0, 1.0), 1.0, vP.y, 1.0);
        if (vP.x > 0.5) s.a *= vNear;                 // (the down alone: a piece whose middle is within about 0.83 m is under 0.04 and not drawn)
        if (s.a < 0.04) discard;
        gl_FragColor = vec4(paperFar(s.rgb, vDist), s.a);
        #include <fog_fragment>
      }`);
    const mesh = new THREE.Mesh(instanced(new THREE.PlaneGeometry(1, 1), n, { iA, iB }), mat);
    mesh.frustumCulled = false; mesh.name = 'scraps'; object.add(mesh); Object.assign(mesh.userData, { iA, iB, nFish });
  }
  await ctx.yield?.();

  // ---- the hero's own lagoon: one opaque torn disc painted as four sliding tissue sheets ----
  if (opts.water !== false) {
    const WR = opts.waterRadius ?? 215, WC = opts.waterCenter ?? [col.x * 0.5, col.z * 0.5];
    const g = new THREE.CircleGeometry(WR, 64); g.rotateX(-Math.PI / 2); g.translate(WC[0], 0, WC[1]);
    const mat = paperMaterial(U, {
      uW0: { value: pal[2].clone() }, uW1: { value: mixc(pal[2], C.white, 0.34) }, uW2: { value: mixc(pal[2], pal[5], 0.7) },
      uW3: { value: mixc(pal[2], lin('#5B86D8'), 0.6) }, uSeedW: { value: rng() }, uCtr: { value: new THREE.Vector2(WC[0], WC[1]) }, uWR: { value: WR },
    }, /* glsl */`
      varying vec3 vW, vWorld; varying float vDist;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0); vW = position; vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world; vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec3 vW, vWorld; varying float vDist;
      uniform vec3 uW0, uW1, uW2, uW3; uniform float uTime, uSeedW, uWR; uniform vec2 uCtr;
      #include <fog_pars_fragment>
      ${PAPER_GLSL}
      // one torn sheet: x = inside the sheet, y = white deckle hairline along its torn edge
      vec2 sheet(vec2 uv, float th) {
        float n = texture2D(uPaper, uv).r, fwn = fwidth(n);
        float hw = max(0.008, 1.5 * fwn);
        return vec2(smoothstep(th - fwn, th + fwn, n), (1.0 - smoothstep(0.0, hw, abs(n - th))) * min(1.0, 0.012 / hw));
      }
      void main() {
        vec2 w = vW.xz; float t = uTime;
        vec3 col = uW0;
        // long torn bands lying across the direction of travel (stretched 3:1 along X), sliding at four speeds
        vec2 s1 = sheet((w - vec2(0.1, -0.8) * t) * vec2(0.34, 1.0) / 19.0 + uSeedW, 0.5);
        vec2 s2 = sheet((mat2(0.97, 0.24, -0.24, 0.97) * w - vec2(-0.3, -0.62) * t) * vec2(0.3, 1.0) / 27.0 + uSeedW * 3.0, 0.5);
        vec2 s3 = sheet((mat2(0.98, -0.2, 0.2, 0.98) * w - vec2(0.45, -0.95) * t) * vec2(0.3, 1.0) / 11.0 + uSeedW * 5.0, 0.72);
        vec2 s4 = sheet((w - vec2(-0.5, -0.7) * t) * vec2(0.4, 1.0) / 33.0 + uSeedW * 7.0, 0.61);
        col = mix(col, uW3, s2.x * 0.85); col = mix(col, uWhite, s2.y * 0.3);
        col = mix(col, uW2, s1.x * 0.85); col = mix(col, uWhite, s1.y * 0.35);
        col = mix(col, mix(uW0, uW1, 0.4), s4.x * 0.5); col = mix(col, uWhite, s4.y * 0.3);
        col = mix(col, uW1, s3.x * 0.7); col = mix(col, uWhite, s3.y * 0.4);
        vec4 br = texture2D(uPaper, (w - vec2(0.0, -0.8) * t) * vec2(0.021, 0.006) + 0.3);
        vec4 br2 = texture2D(uPaper, (w - vec2(0.1, -0.8) * t) * vec2(0.23, 0.05) + 0.7);
        col *= (0.9 + 0.2 * br.b) * (0.9 + 0.2 * br2.b);
        float e = clamp((1.0 - length(w - uCtr) / uWR) * 14.0, 0.0, 1.0);
        vec4 s = paperSheet(col, w / 14.0, e, 1.0, 0.37, 1.0);
        if (s.a < 0.04) discard;
        gl_FragColor = vec4(paperFar(mix(col, s.rgb, 0.6 + 0.4 * step(e, 0.5)), length(vWorld - cameraPosition)), 1.0);
        #include <fog_fragment>
      }`, {}, { alphaToCoverage: false, depthWrite: opts.waterDepthWrite ?? true });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'lagoon'; mesh.frustumCulled = false; mesh.renderOrder = -0.5; object.add(mesh);
  }

  // ---- the cloud cap: torn sheets, lilac underneath, with the portal's hole ----
  if (opts.cloud !== false) {
    const n = 7, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), spread = 4 + 14 * k;
      iA.set([rng.range(-spread, spread), TOP + 4.5 + i * 4.2, rng.range(-spread, spread), rng.range(88, 100) + 80 * k], i * 4);
      iB.set([rng(), Math.max(0, 1 - k * 0.85), rng() * TAU, rng.range(0.85, 1.25)], i * 4);
    }
    const mat = paperMaterial(U, { uSeat: { value: seat.clone() }, uHoleDir: { value: new THREE.Vector2(hEnd.x, hEnd.y) }, uLilac: { value: mixc(lilac, pal[2], 0.12).multiplyScalar(0.8) } }, /* glsl */`
      attribute vec4 iA, iB;
      uniform float uTime; uniform vec3 uSeat;
      varying vec2 vQ, vH; varying vec3 vP; varying float vDist;
      #include <fog_pars_vertex>
      void main() {
        vec3 c = vec3(uSeat.x + iA.x + 5.0 * sin(uTime * 0.05 + iB.z), iA.y, uSeat.z + iA.z + 4.0 * cos(uTime * 0.04 + iB.z * 1.7));
        vec3 p = c + vec3(position.x * iA.w * iB.w, position.x * iA.w * 0.04 * sin(iB.z), position.y * iA.w);
        vec4 world = modelMatrix * vec4(p, 1.0);
        vQ = position.xy; vH = p.xz - uSeat.xz; vP = vec3(iB.x, iB.y, iA.w);
        vec4 mvPosition = viewMatrix * world; vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec2 vQ, vH; varying vec3 vP; varying float vDist;
      uniform vec3 uLilac, uSunC; uniform vec2 uHoleDir; uniform float uSunK;
      #include <fog_pars_fragment>
      ${PAPER_GLSL}
      void main() {
        vec4 n = texture2D(uPaper, vQ * 0.55 + vP.x);
        float e = (1.0 - length(vQ * 2.0)) * 1.7 + (n.a - 0.5) * 1.5;
        float al = dot(vH, uHoleDir);
        vec2 hq = vH - uHoleDir * al * (al < 0.0 ? 0.45 : 0.0);
        e = min(e, (length(hq) / 10.5 - 1.0) * 2.2 + (n.r - 0.5) * 0.3);
        vec3 col = mix(uWhite, uLilac, vP.y);
        // the sun in the eye warms the paper round the hole: two torn rings of apricot and gold tissue
        float hr = length(hq) + (n.b - 0.5) * 9.0;
        col = mix(col, mix(col, uWhite * uSunC, 0.75), uSunK * (1.0 - smoothstep(30.0, 31.5, hr)) * 0.55);
        col = mix(col, uWhite * uSunC * 1.08, uSunK * (1.0 - smoothstep(17.0, 18.2, hr)) * 0.6);
        vec4 s = paperSheet(col, vQ * vP.z / 9.0 + vP.x, clamp(e, 0.0, 1.0), 1.0, vP.x, 1.0);
        if (s.a < 0.04) discard;
        gl_FragColor = vec4(paperFar(s.rgb, vDist * 0.35), s.a);
        #include <fog_fragment>
      }`);
    const mesh = new THREE.Mesh(instanced(new THREE.PlaneGeometry(1, 1), n, { iA, iB }), mat);
    mesh.frustumCulled = false; mesh.name = 'cloud'; object.add(mesh);
  }
  await ctx.yield?.();

  // ---- anchors, progress hooks, update ----
  const arr = (v) => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
  let closest = birds[0], cd = 1e9;
  for (const b of birds) { if (b.s > 0.4) continue; const d = Math.hypot(b.c.x - flyPts[3].x, b.c.z - flyPts[3].z); if (d < cd) { cd = d; closest = b; } }
  const anchors = {
    flyThrough: flyPts.map(arr),
    portalSeat: { position: arr(seat), normal: arr(dirEnd.clone().negate()), direction: arr(dirEnd) },
    approachStart: arr(approachStart), columnFoot: arr(col), columnTop: arr(seat),
    horseshoeCenter: [+(skew * 0.5).toFixed(2), 1, +(ZM - depth * 0.5).toFixed(2)], mouth: [0, 0.8, ZM],
    leftArm: arr(flyPts[2]), rightBend: arr(P5),
    closestBird: { open: [closest.o.x, 0, closest.o.z], closed: [closest.c.x, 0, closest.c.z], arc: closest.f, phase: closest.phase },
    viewpoints: [
      { name: 'mouth', position: [-4, 2.2, ZM + 30], target: [0, 1.5, ZM - depth * 0.6] },
      { name: 'leftPass', position: arr(flyPts[2]), target: [closest.c.x, 0.7, closest.c.z - 3] },
      { name: 'underColumn', position: arr(approachStart), target: arr(seat) },
    ],
    clearance: { fishers: +clearF.toFixed(2), soarers: +clearS.toFixed(2) },
  };
  let progress = null, wave = null;
  const radius = 24, height = 12, center = new THREE.Vector3(0, 2, -2);
  // Free flyers cut from the same pelican: list = [{ x, y, z, yaw, launch (u, or -1 = always flying), scale, seed,
  // phase, flap, dal }], o = { colors (overrides of the bird's colour set), lod, shadow, neck [a1,a2,a3], run, rise
  // (launch speeds, m/s), flapRate, clipY, foldTint [r,g,b], hideBefore (not drawn until its launch u) }. Uniforms are on mesh.userData.u.
  function makeFlock(list, o = {}) {
    const Cx = { ...C, ...(o.colors ?? {}) };
    if (o.colors) for (const k of ['breast', 'ridge', 'nail', 'shadow']) Cx[k] = o.colors[k];
    const base = buildPelicanGeometry(Cx, !!o.lod), sh = o.shadow ? 2 : 1, m = list.length, n = m * sh;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iD = new Float32Array(n * 4);
    list.forEach((b, i) => { for (let q = 0; q < sh; q++) { const k = (i + q * m) * 4;
      iA.set([b.x, b.y, b.z, b.yaw ?? 0], k); iB.set([b.phase ?? 0, b.launch ?? -1, b.scale ?? 1, b.seed ?? 0.5], k);
      iC.set([q, b.dal ?? 0, b.flush ?? 0.5, b.flap ?? 1], k); } });
    const fu = {
      uU: { value: 0 }, uGlide: { value: 1 }, uHide: { value: o.hideBefore ? 1 : 0 }, uFlapRate: { value: o.flapRate ?? 4.2 }, uClipY: { value: o.clipY ?? -1e6 },
      uLaunch: { value: new THREE.Vector4(o.run ?? 0, o.rise ?? 0, 0, 0) }, uSlip: { value: o.slip ?? 0.07 }, uHover: { value: new THREE.Vector3(0, 0, 0) },
      uNeck: { value: new THREE.Vector3(...(o.neck ?? [2.75, 0.15, -0.12])) }, uFoldTint: { value: new THREE.Vector3(...(o.foldTint ?? [1, 1, 1])) },
    };
    const mesh = new THREE.Mesh(instanced(base, n, { iA, iB, iC, iD }), paperMaterial(U, { ...birdU, ...fu }, BIRD_VERT, BIRD_FRAG, { FLY: 1 }));
    mesh.frustumCulled = false; mesh.userData.u = fu; mesh.userData.iA = iA; mesh.userData.iD = iD; mesh.userData.count = m; mesh.userData.copies = sh;
    return mesh;
  }
  const fisherList = birds.map((b) => ({ o: [b.o.x, b.o.z], c: [b.c.x, b.c.z], yaw: b.yaw, s: b.s, scale: b.scale, seed: b.seed, dal: b.dal, phase: b.phase, joiner: !!b.joiner }));
  return {
    object, radius, height, center, anchors, uniforms: U, ground: false, groundY: 0,
    counts: { fishers: birds.length, soarers: soar.length }, paper, colors: C, makeFlock,
    fisherList,
    setPlace(i, x, z, yaw) {                      // (before the first frame) moves fisher i, open and closed, to (x, z) facing yaw
      const fm = object.getObjectByName('fishers'), rm = object.getObjectByName('rings'), n = birds.length, b = birds[i], f = fisherList[i];
      b.o.x = b.c.x = x; b.o.z = b.c.z = z; b.yaw = yaw; f.o = [x, z]; f.c = [x, z]; f.yaw = yaw;
      for (const sh of [0, 1]) { const o = (i + sh * n) * 4; fm.userData.iA.set([x, z, x, z], o); fm.userData.iB[o] = yaw; }
      for (let k = 0; k < 3; k++) { const o = (i * 3 + k) * 4; rm.userData.iA.set([x, z, x, z], o); rm.userData.iB[o] = yaw; }
      for (const m of [fm, rm]) { m.geometry.attributes.iA.needsUpdate = true; m.geometry.attributes.iB.needsUpdate = true; }
    },
    shape: (s, k = 1) => { const a = horseshoePoint(s, A0, depth, ZM, skew), c = horseshoePoint(s, A1, depth * 0.94, ZM, skew); return [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k]; },
    joiners: { first: nCore, count: birds.length - nCore },
    setPhase(i, phase) {                          // (before the first frame) the dip phase of fisher i, in cycles
      const fm = object.getObjectByName('fishers'), rm = object.getObjectByName('rings'), n = birds.length;
      birds[i].phase = phase;
      for (const sh of [0, 1]) fm.userData.iB[(i + sh * n) * 4 + 1] = phase;
      for (let k = 0; k < 3; k++) rm.userData.iB[(i * 3 + k) * 4 + 1] = phase;
      fm.geometry.attributes.iB.needsUpdate = true; rm.geometry.attributes.iB.needsUpdate = true;
    },
    // (before the first frame) stands the arc's fish, then the world's leaping fish `more`, off the camera's line (in this piece's space) by
    // standOff. An arc fish's box, from the scraps' program: wander 6.0 / 2; in the air 1.4 m from its base, y -0.04 to iB.w - 0.04; its
    // glide under the water (drawn where the lagoon writes no depth) to 1.4 / 0.4 at y -0.6 - 0.04; far corner 0.5 x iB.x x hypot(1, 0.42);
    // 1.5 m from a fisher (the designer's). inArc: the closed horseshoe's own law turned round, the mouth's chord closing it.
    async standFish(path, PT, more) {
      const sm = object.getObjectByName('scraps'), { iA, iB, nFish } = sm.userData, fish = [], pause = ctx.yield ? () => ctx.yield() : null;
      for (let i = 0; i < nFish; i++) fish.push({ x: iA[i * 4], z: iA[i * 4 + 1], h: 6.0 / 2, slabs: [[1.4, -0.04, iB[i * 4 + 3] - 0.04], [1.4 / 0.4, -0.6 - 0.04, -0.6 - 0.04]], skin: 0.5 * iB[i * 4] * Math.hypot(1, 0.42), keep: 1.5 });
      const line = { path, PT, fishers: birds.map((b) => [b.c.x, b.c.z]), centre: [skew * 0.5, ZM - depth * 0.5],
        inArc: (x, z) => { const t = (ZM - z) / (depth * 0.94), sn2 = Math.pow(Math.max(t, 0), 2 / 0.85); return t >= 0 && t <= 1 && Math.abs(x - skew * sn2) <= A1 * Math.pow(1 - sn2, 0.36); } };
      const counts = [await standOff(line, fish, pause), await standOff(line, more, pause)];
      fish.forEach((f, i) => { iA[i * 4] = f.x; iA[i * 4 + 1] = f.z; }); sm.geometry.attributes.iA.needsUpdate = true;
      if (counts.some((c) => c.pair + c.short)) console.warn('pelican-collage: leaping fish left as a pair or short of 2 m', counts);
      return counts;
    },
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); },
    setWave(cycles) { wave = cycles; },
    update(dt, time) {
      U.uTime.value = time;
      U.uWave.value = wave ?? time / 3;
      const auto = 0.5 - 0.5 * Math.cos(time * TAU / 90);
      const p = progress ?? auto;
      U.uClose.value = p * p * (3 - 2 * p);
    },
    dispose() { paper.dispose(); },
  };
}
