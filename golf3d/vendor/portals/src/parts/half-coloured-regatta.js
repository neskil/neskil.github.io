// half-coloured-regatta: THE BOOK. A colouring book and a pack of felt-tips. Everything is a sheet of QUADS on unlit white
// paper. A quad carries the printed black line along its own edges (a width for each edge, in metres: bold for a thing's
// outline, thin for the lines that divide it into cells, none where two quads make one cell) and at most one pen (a
// flame alone carries three, one tongue inside the other). A pen
// colours its cell in parallel strokes, to and fro, one after another across the cell: a stroke stops short of the line
// here and there and leaves a sliver of paper; where two strokes lap the ink is darker (inks multiply); a shadow is a
// second coat of the same pen. Eight pens and no grey; the tone map is off (post.flat), so what is shown is the paper's
// colour times the pen's (inks multiply), a shade under the pen's own value.
//
// HOW FAR A CELL IS COLOURED (aFill: start, span, cap, mode) is one of four laws, each typed where the cell is laid:
//   mode 0  BY PLACE: (uS - start) / span, uS being the metres of route the eye has flown (the world writes it)
//   mode 1  BY THE PLACE'S OWN CLOCK: scribbled over anew every `span` seconds, `start` its share of that wave, never
//           under six tenths coloured (a flame)
//   mode 2  coloured (a thing that is coloured at every metre)
//   mode 3  BY A BOAT'S OWN WAY ALONG ITS COURSE (aInst.x, written by the world from the clock): a boat of the fleet
//           is blank at the start and coloured along the way, panel after panel
// cap is the most of the cell that is ever coloured (a cell left half done). The sea and the sand carry none of the
// four: they are coloured in the world's own plan by the route's field (see the fragment shader).
//
// WHAT READS THE EYE in this file, named here (section 153): four footprint filters (fwidth), and nothing else.
//   1 a printed line is never drawn thinner than about a pixel (edge()): where it would be finer it is drawn about a
//     pixel wide at full ink. This is a floor on the line's width and not a paling: it hides nothing, and a far line
//     is therefore broader in metres than was asked of it;
//   2 so two lines that face each other across a quad less than 3.6 pixels apart would be half of it and more: that
//     pair goes over from there into its MEAN (the two lines' own share of the quad's breadth, as that much ink over
//     the quad) and is the mean alone where they are under a pixel apart; the other pair, which runs along such a
//     quad (a hoop round a far drum, a rim), stays; the one line of a cut-out pales by its quad's lesser side; pen
//     and paper stay;
//   3 strokes narrower than about five pixels begin to draw as their mean (the cell coloured as far as the hand has
//     come), and under about two pixels are the mean alone; the mean's front is a stroke wide and never under two
//     pixels, kept inside its cell;
//   4 the sea's printed scallops, rows 16 m deep, pale by a pixel's footprint on the sea, measured as its span along
//     the rows' depth (z) and half its span along the rows (x): from 1.2 m, gone at 3.2 m (seen along z a row is
//     then five pixels deep and its lines would run together; seen from straight above, seven and a half).
// No light, no fog. A cut-out (a cloud, the sun, a flame) is cut LAST, after every derivative and the texture read. ONE TEXTURE, of numbers and not of a picture: the route's field (the world makes it): at each
// place of the plan the metres of route nearest it and how far to the left of the route it lies; the sea and the sand
// are coloured by it (see the fragment shader).
import * as THREE from 'three';

export const PAPER = '#FBFAF2', LINE = '#17171C';
// the eight pens, by my own eye: scarlet, orange, lemon, leaf green, turquoise, ultramarine, pink, violet (index 0 is no pen)
export const PENS = ['#FBFAF2', '#E9362B', '#F6902A', '#F8DD3A', '#57BA46', '#24B9B6', '#2D55CC', '#F272AB', '#7C4ABB'];
export const PEN = { none: 0, scarlet: 1, orange: 2, lemon: 3, green: 4, turquoise: 5, blue: 6, pink: 7, violet: 8 };
export const KIND = { plain: 0, sea: 1, ring: 2, flame: 3, cloud: 4, flag: 5, sun: 6, ground: 7 };
export const MODE = { place: 0, clock: 1, full: 2, boat: 3 };
export const BOLD = 0.42, THIN = 0.16;   // half widths of the printed line, in metres

const VERT = /* glsl */`
attribute vec3 aUV; attribute vec3 aSize; attribute vec4 aInk; attribute vec4 aFill; attribute vec4 aEdge;
#ifdef INST
attribute vec4 aInst;
#endif
uniform float uS, uTime, uStroke;
varying vec3 vUV; varying vec3 vSize; varying vec4 vInk; varying vec4 vEdge; varying float vProg; varying vec3 vWorld; varying float vPerm; varying vec3 vStk;
void main() {
  vec3 p = position; float kind = aSize.z;
  float fu = aUV.x / max(aUV.z, 1e-4);
  if (kind == 5.) p += normal * sin(uTime * 5.5 - fu * 5. + aInk.w * 40.) * .08 * aSize.x * fu;      // a flag in the wind: still at its u0 side
  float ip = 0.; vPerm = 0.;
#ifdef INST
  ip = aInst.x; vPerm = aInst.y;
#endif
  float m = aFill.w, prog;
  if (m < .5) prog = clamp((uS - aFill.x) / max(aFill.y, .001), 0., 1.);
  else if (m < 1.5) prog = .62 + .38 * smoothstep(0., .6, fract(uTime / max(aFill.y, .001) + aFill.x));
  else if (m < 2.5) prog = 1.;
  else prog = clamp((ip - aFill.x) / max(aFill.y, .001), 0., 1.);
  vProg = prog * aFill.z; vUV = aUV; vSize = aSize; vInk = aInk; vEdge = aEdge;
  // the strokes of this cell: how many fit across it, its width across them, its length along them (a broader pen for the wake; the sea and the sand do not read it)
  float a = aInk.z, sw = uStroke * (kind == 2. ? 1.6 : 1.);
  float across = abs(sin(a)) * aSize.x + abs(cos(a)) * aSize.y, along = abs(cos(a)) * aSize.x + abs(sin(a)) * aSize.y;
  vStk = vec3(max(2., floor(across / sw + .5)), across, along);
#ifdef INST
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
#else
  vec4 w = modelMatrix * vec4(p, 1.);
#endif
  vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
}`;

// what a quad carries is the same at its four corners, but a varying comes through with the last bit astray: every
// whole number and the seed are rounded here before they are read (a seed astray by a millionth is another stroke);
// the seed is laid as a whole number of 4096ths, so the rounding never stands on a knife's edge
const FRAG = /* glsl */`
uniform vec3 uPens[9]; uniform vec3 uPaper, uLine; uniform float uTime, uS; uniform vec4 uRing, uBox; uniform vec3 uLead; uniform sampler2D uRoute;
varying vec3 vUV; varying vec3 vSize; varying vec4 vInk; varying vec4 vEdge; varying float vProg; varying vec3 vWorld; varying float vPerm; varying vec3 vStk;
float hash(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
vec3 penCol(float k) { float pm = floor(vPerm + .5), i = k; if (pm > .5 && k > .5) i = mod(k - 1. + pm, 8.) + 1.; return max(uPens[int(clamp(i, 0., 8.) + .5)], vec3(.02)); }
// a tongue of flame's half width at the share v of its height (0 at its foot and at its tip)
float tongue(float v) { return pow(max(0., sin(3.14159265 * pow(clamp(v, 0., 1.), .55))), .9) * (1. - .3 * v); }
float edge(float d, float w) { float fw = max(fwidth(d) * .9, 1e-6); float h = max(w, fw); return w > 0. ? 1. - smoothstep(h - fw, h + fw, d) : 0.; }
void main() {
  float kind = floor(vSize.z + .5), pen = floor(vInk.x + .5), coatsN = floor(vInk.y + .5), seed = floor(vInk.w * 4096. + .5) / 4096.;
  vec4 rf = texture2D(uRoute, (vWorld.xz - uBox.xy) * uBox.zw);        // the route's field; read before any cut (the cut is made last)
  // u is carried as (u q, q): for a plain quad q is 1; for a tapering side of a drum q is the side's width at that
  // height over its mean width, so that lines of equal u run to the apex on both of the quad's triangles alike, and sx
  // is the side's true width there
  vec3 col = uPaper; vec2 uv = vec2(vUV.x / max(vUV.z, 1e-4), vUV.y); float sx = vSize.x * vUV.z, line = 0., lu = 0., lv = 0.; bool cut = false, pair = false;
  if (kind == 4.) {            // a cloud: four lobes on a flat foot, cut out of its quad with a gap of white left round it
    float asp = vSize.x / vSize.y, hw = asp * .5 - .34; vec2 q = vec2((uv.x - .5) * asp, uv.y - .3);
    float d = length(q - vec2(-.62 * hw, .0)) - .2;
    d = min(d, length(q - vec2(-.2 * hw, .14)) - .32); d = min(d, length(q - vec2(.24 * hw, .1)) - .28); d = min(d, length(q - vec2(.64 * hw, -.01)) - .19);
    d = max(d, -.17 - q.y);
    cut = d > .09; line = edge(abs(d) * vSize.y, max(vEdge.x, .001));
  } else if (kind == 6.) {     // the sun: a disc and its rays, cut out of its quad
    vec2 q = uv - .5; float r = length(q), a = atan(q.y, q.x), ray = abs(fract(a * 14. / 6.2831853) - .5);
    float dr = (ray - .16 * (1. - (r - .26) / .26)) * r * .4488;     // a ray's flank as a length (a fourteenth of the round at r)
    float d = min(r - .2, max(max(.26 - r, r - .47), dr)), w = max(vEdge.x, .001);
    cut = d > 0.; line = max(edge(abs(r - .2) * vSize.x, w), edge(abs(d) * vSize.x, w * .2));      // the rays in a line a fifth of the disc's
  } else if (kind == 3.) {     // a flame, wavering by the clock: three tongues one inside the other, three cells: scarlet, orange, a lemon core
    float v = uv.y, xx = abs(uv.x - .5 - (.1 * sin(v * 6. - uTime * 8. + seed * 40.) + .05 * sin(v * 13. - uTime * 13. + seed * 70.)) * v);
    float d1 = xx - .4 * tongue(v), d2 = v < .68 ? xx - .25 * tongue(v / .68) : xx + (v - .68), d3 = v < .4 ? xx - .13 * tongue(v / .4) : xx + (v - .4);
    cut = d1 > 0.; pen = d3 < 0. ? 3. : d2 < 0. ? 2. : 1.;
    float w = max(vEdge.x, .001); line = max(edge(-d1 * vSize.x, w), max(edge(abs(d2) * vSize.x, w * .6), edge(abs(d3) * vSize.x, w * .6)));
  } else {
    lu = max(edge(uv.x * sx, vEdge.x), edge((1. - uv.x) * sx, vEdge.y)); lv = max(edge(uv.y * vSize.y, vEdge.z), edge((1. - uv.y) * vSize.y, vEdge.w));
    line = max(lu, lv); pair = true;      // the lines at u0 and u1, and the lines at v0 and v1
  }
  if (kind == 1. || kind == 7.) {
    // THE SEA AND THE SAND are coloured in the world's own plan, not tile by tile. THE LAGOON (the sea inside uRing.w
    // metres of its middle) and the bar of sand round it (to 80 m beyond) are coloured at every metre, the lagoon round
    // and round. Everywhere else the pen goes ALONG THE ROUTE in strokes side by side, each stroke as far as its own
    // tip: on the sand the tip of a stroke lies uLead.y metres of route ahead of the eye, on the sea at uLead.z times the
    // metres flown and uLead.x more (the colouring of the sea runs on ahead of us), less the stroke's own lag (up to about 250 m on the
    // sea, a third of that on the sand: a lag of its own and a slow wave from stroke to stroke; its end is rounded like
    // a nib's), so the edge of the colouring is a fringe of stroke ends that goes before the eye. The strokes have no end to either side: beyond the field's
    // box its edge value stands, so the far sea is coloured with the nearest part that the field knows. Where the nearest
    // part of the route changes (the field's ridge) two runs of strokes meet at an angle, and early in the flight a
    // coloured run meets one not yet reached: the hand's own joins (each a band as wide as a cell of the field). The circle
    // where the lagoon's law meets the sea's (uRing.w from its middle) lies under the bar of sand, but for the bar's
    // mouth, where the two meet in a plain join. The strokes of BOTH laws and their footprints are worked out for every
    // pixel before the choice between them: no derivative is taken inside a branch that changes from pixel to pixel.
    if (pen > .5) {
      vec3 ink = penCol(pen); float coats = 0., cov = 1., y, fw; vec2 lg = vWorld.xz - uRing.xy; float rl = length(lg);
      float ang = atan(lg.x, lg.y) / 6.2831853, yL = rl / 13. + .1 * sin(ang * 56.5486678), SW = kind == 1. ? 15. : 12., yS = rf.g / SW + .1 * sin(rf.r * .045);
      float fwL = max(fwidth(yL), 1e-6), fwS = max(fwidth(yS), 1e-6);
      if (kind == 1. && rl < uRing.w) {
        y = yL; fw = fwL;
        float f = y - floor(y);
        // this ring's stroke, the one before and the one after: each lies from .04 to 1.17 of its own breadth, its two
        // ends soft by a pixel's footprint; with all three counted the coats have no jump where one cell meets the next
        for (int k = -1; k < 2; k++) { float fj = f + float(k); coats += smoothstep(.04 - fw, .04 + fw, fj) * (1. - smoothstep(1.17 - fw, 1.17 + fw, fj)); }
      } else {
        float lag = kind == 1. ? 1. : .33;
        float lead = (kind == 1. ? uS * uLead.z + uLead.x : uS + uLead.y) + (kind == 7. && rl < uRing.w + 80. ? 1e5 : 0.) - rf.r;
        y = yS; fw = fwS;
        float j = floor(y), f = y - j;
        for (int k = -1; k < 2; k++) {          // this stroke, the one before and the one after
          float jj = j - float(k), h = hash(jj * 1.3 + 2.), fj = f + float(k), fk = 2. * fj - 1.;
          float on = step((130. * h + 110. * (.5 + .5 * sin(jj * .21 + 1.3)) + 9. * min(fk * fk, 1.5)) * lag, lead);
          coats += on * smoothstep(.04 - fw, .04 + fw, fj) * (1. - smoothstep(1.17 - fw, 1.17 + fw, fj));
        }
        cov = clamp(lead / (240. * lag), 0., 1.);
      }
      col = mix(uPaper * pow(ink, vec3(coats)), mix(uPaper, uPaper * pow(ink, vec3(1.04)), cov), smoothstep(.2, .55, fw));
    }
  } else if (pen > .5 && vProg > .001 && kind != 4.) {
    float a = vInk.z, ca = cos(a), sa = sin(a); vec2 m = (uv - .5) * vSize.xy, q = vec2(ca * m.x + sa * m.y, -sa * m.x + ca * m.y);
    float N = floor(vStk.x + .5), W = vStk.y / N;
    float y = q.y / W + N * .5 + .1 * sin(q.x * 2.2 / W + seed * 9.);          // the hand's waver
    float i = clamp(floor(y), 0., N - 1.), f = y - i, x = q.x / vStk.z + .5, fw = max(fwidth(y), 1e-6), front = vProg * (N + .35);
    vec3 ink = penCol(pen); float coats = 0.;
    // this stroke, the one before it, whose edge laps over this one, and the one after, whose soft start reaches back
    // into this cell (not on the wake, whose strokes start hard at their own edge)
    for (int k = -1; k < 2; k++) {
      float j = i - float(k);
      if (j >= 0. && j <= N - 1. && (k >= 0 || kind != 2.)) {
        float t = front - j, h = hash(j + seed * 31.), h2 = hash(j * 1.7 + seed * 17.);
        float dir = mod(j, 2.) < 1. ? x : 1. - x;
        float lo = h > .55 ? .02 + .09 * h2 : -.01, hi = h2 > .5 ? .98 - .1 * h : 1.01;     // a stroke stops short: a sliver of paper
        if (kind == 2.) { lo = -.01; hi = 1.01; }                                           // (not on the wake: it is gone over too often)
        float on = step(1e-4, t) * step(dir, clamp(t, 0., 1.) * 1.02) * step(lo, x) * step(x, hi);
        float fj = f + float(k), gap = kind == 2. ? -1. : .03 + .11 * step(.7, h) * h2;
        coats += on * smoothstep(gap - fw, gap + fw, fj) * (1. - smoothstep(1.16 - fw, 1.16 + fw, fj));
      }
    }
    float full = coatsN;
    if (kind == 2.) {           // the wake: coat on coat, the newest behind the boat
      float da = fract((uRing.z - atan(vWorld.x - uRing.x, vWorld.z - uRing.y)) / 6.2831853);
      full *= 1.5 + 1.3 * (1. - da) * (1. - da);
    }
    // far off, strokes draw as their mean (from about five pixels a stroke, wholly under two): the cell coloured as far as the hand has come
    // the front a stroke wide and never under two pixels, its window kept inside the cell: a finished cell is whole and a
    // cell smaller than the window is coloured by the share the hand has come
    float mw = .5 * max(1., 2. * fw), mlo = max(y - mw, 0.), mhi = min(y + mw, N);
    vec3 mean = mix(uPaper, uPaper * pow(ink, vec3(1.04 * full)), clamp((front - mlo) / max(mhi - mlo, 1e-4), 0., 1.));
    col = mix(uPaper * pow(ink, vec3(coats * full)), mean, smoothstep(.2, .55, fw));
  }
  if (kind == 1.) {             // the sea's printed lines: rows of scallops 16 m deep that slide against each other
    // one print; it pales where a pixel covers more than 1.2 m of sea and is gone at 3.2 m (the head, filter 4): the far
    // sea is the pen alone
    float fwd = fwidth(vWorld.z) + fwidth(vWorld.x) * .5, R = 16.;
    float row = floor(vWorld.z / R), f = fract(vWorld.z / R), dirn = mod(row, 2.) * 2. - 1.;
    float fx = fract((vWorld.x + dirn * uTime * 2.4 + hash(row + R) * 40.) / 34.), c = .22 + .5 * sin(3.14159265 * fx);
    float d = abs(f - c) * R, on = clamp(1.6 - fwd * .5, 0., 1.);
    line = max(line, (1. - smoothstep(.14, .14 + fwd, d)) * on * .9);
  } else {
    // two lines that face each other less than 3.6 pixels apart (each about a pixel at least) would be half of the
    // quad and more: that pair goes over into its mean, the lines' true share of the quad's breadth (a 0.9 m board
    // between two bold lines stays nine tenths ink at any distance; a far mast a third); the pair that runs along the
    // quad stays; a cut-out's one line pales by the lesser side (the head, filter 2). pu, pv: the quad's u and v spans in pixels
    float pu = vSize.x / max(fwidth(uv.x * vSize.x), 1e-5), pv = vSize.y / max(fwidth(uv.y * vSize.y), 1e-5);
    line = pair ? max(mix(clamp((vEdge.x + vEdge.y) / max(sx, 1e-5), 0., 1.), lu, smoothstep(1., 3.6, pu)), mix(clamp((vEdge.z + vEdge.w) / max(vSize.y, 1e-5), 0., 1.), lv, smoothstep(1., 3.6, pv))) : line * smoothstep(1., 3.6, min(pu, pv));
  }
  if (cut) discard;
  gl_FragColor = vec4(mix(col, uLine, line), 1.);
}`;

export function makeBook(opts = {}) {
  const U = { uS: { value: 0 }, uTime: { value: 0 }, uStroke: { value: opts.stroke || 2.8 }, uRing: { value: new THREE.Vector4(0, 0, 0, 0) }, uBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uLead: { value: new THREE.Vector3(900, 400, 2.6) }, uRoute: { value: null },
    uPens: { value: PENS.map((c) => new THREE.Color(c)) }, uPaper: { value: new THREE.Color(PAPER) }, uLine: { value: new THREE.Color(LINE) } };
  const mat = (inst, side) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, side: side ?? THREE.DoubleSide, defines: inst ? { INST: 1 } : {} });
  const plain = mat(false), boats = mat(true);
  // a sheet of quads. quad(a, b, c, d, o): a (u0 v0), b (u1 v0), c (u1 v1), d (u0 v1), each [x, y, z]; o: pen, coats, dir (the
  // strokes' angle in the quad's own u, v), seed, fill [start, span, cap, mode], edge [u0, u1, v0, v1] half widths, kind, size.
  // A TRIANGLE is laid as a quad whose c and d are one point: only a, b, c is drawn, so only its v0 side (a to b) and its
  // u1 side (b to c) can carry a line; it asks none at u0 and v1, and gives its true size (o.size) where a line is asked.
  // A triangle that waves as a flag is laid with b and c one point instead (both at u1, so both are moved alike): only
  // a, c, d is drawn, and only its u0 side (a to d) and its v1 side (d to c) can carry a line.
  // o.q [at a and b, at c and d]: for a side that tapers, its width there over its mean width (see the fragment shader).
  const sheet = () => {
    const P = [], NR = [], UV = [], SZ = [], INK = [], FL = [], ED = [], IX = []; let n = 0;
    const quad = (a, b, c, d, o = {}) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const su = o.size ? o.size[0] : 0.5 * (Math.hypot(ux, uy, uz) + Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2])), sv = o.size ? o.size[1] : 0.5 * (Math.hypot(vx, vy, vz) + Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]));
      const e = o.edge || [THIN, THIN, THIN, THIN], f = o.fill || [0, 1, 1, MODE.full], seed = Math.round((o.seed ?? ((n * 0.6180339) % 1)) * 4096) / 4096;   // a whole number of 4096ths, as the shader rounds it
      const pts = [a, b, c, d], uvs = [0, 0, 1, 0, 1, 1, 0, 1], qq = o.q || [1, 1];
      for (let k = 0; k < 4; k++) { const qk = qq[k >> 1]; P.push(pts[k][0], pts[k][1], pts[k][2]); NR.push(nx, ny, nz); UV.push(uvs[2 * k] * qk, uvs[2 * k + 1], qk); SZ.push(Math.max(su, 0.01), Math.max(sv, 0.01), o.kind || 0);
        const fk = o.fills ? o.fills[k] : f; INK.push(o.pen || 0, o.coats || 1, o.dir || 0, seed); FL.push(fk[0], fk[1], fk[2], fk[3]); ED.push(e[0], e[1], e[2], e[3]); }
      IX.push(4 * n, 4 * n + 1, 4 * n + 2, 4 * n, 4 * n + 2, 4 * n + 3); n++;
    };
    const geometry = () => { const g = new THREE.BufferGeometry(), A = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);
      g.setAttribute('position', A(P, 3)); g.setAttribute('normal', A(NR, 3)); g.setAttribute('aUV', A(UV, 3)); g.setAttribute('aSize', A(SZ, 3)); g.setAttribute('aInk', A(INK, 4));
      g.setAttribute('aFill', A(FL, 4)); g.setAttribute('aEdge', A(ED, 4)); g.setIndex(n * 4 > 65535 ? new THREE.BufferAttribute(new Uint32Array(IX), 1) : new THREE.BufferAttribute(new Uint16Array(IX), 1));
      g.computeBoundingSphere(); return g; };
    return { quad, geometry, count: () => n };
  };
  const mesh = (sh, name) => { const m = new THREE.Mesh(sh.geometry(), plain); m.name = name || 'sheet'; m.frustumCulled = false; return m; };
  const fleet = (sh, count, name) => { const g = sh.geometry(), inst = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); inst.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aInst', inst);
    const m = new THREE.InstancedMesh(g, boats, count); m.name = name || 'fleet'; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return { mesh: m, inst }; };
  return { uniforms: U, sheet, mesh, fleet, plain };
}

// ---- shapes, each laid into a sheet in the caller's own frame: T(x, y, z) gives the world place of a local point ----
export const frame = (ox, oy, oz, rot = 0, scale = 1) => { const c = Math.cos(rot), s = Math.sin(rot); return (x, y, z) => [ox + scale * (c * x + s * z), oy + scale * y, oz + scale * (-s * x + c * z)]; };

// a box on its base, faces as quads; o.pens: [front, right, back, left, top]; o.fill a law for all, or o.fills per face
export function box(sh, T, w, h, d, o = {}) {
  const x = w / 2, z = d / 2, pens = o.pens || [0, 0, 0, 0, 0], E = o.edge || [BOLD, BOLD, BOLD, BOLD], F = (k) => (o.fills ? o.fills[k] : o.fill), q = (a, b, c, e, k, coats) => sh.quad(a, b, c, e, { pen: pens[k], coats, dir: o.dir ?? Math.PI / 2, fill: F(k), edge: E, seed: o.seed != null ? o.seed + k * 0.13 : undefined });
  q(T(-x, 0, z), T(x, 0, z), T(x, h, z), T(-x, h, z), 0, 1); q(T(x, 0, z), T(x, 0, -z), T(x, h, -z), T(x, h, z), 1, 2);
  q(T(x, 0, -z), T(-x, 0, -z), T(-x, h, -z), T(x, h, -z), 2, 2); q(T(-x, 0, -z), T(-x, 0, z), T(-x, h, z), T(-x, h, -z), 3, 1);
  if (o.top !== false) q(T(-x, h, z), T(x, h, z), T(x, h, -z), T(-x, h, -z), 4, 1);
}

// a drum or a cone frustum of n sides between two heights, banded: bands [[y0, y1, r0, r1, pen, fill]]; a side that
// BEGINS past the half and before 0.92 of the way round takes a second coat for the shade (with 6, 8, 10 or 12 sides
// that is the arc from the first side's start past the half, at 0.67, 0.63, 0.6 or 0.58, to the whole round; with 16
// sides from 0.56 to 0.94); each side has strokes of its
// own; a side that tapers carries its taper (o.q), so its strokes and ribs run to the apex
export function drum(sh, T, n, bands, o = {}) {
  for (const [y0, y1, r0, r1, pen, fill] of bands) for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    sh.quad(T(r0 * c0, y0, r0 * s0), T(r0 * c1, y0, r0 * s1), T(r1 * c1, y1, r1 * s1), T(r1 * c0, y1, r1 * s0), { pen: typeof pen === 'function' ? pen(k) : pen, coats: (k / n > 0.5 && k / n < 0.92) ? 2 : 1, q: r0 === r1 ? undefined : [Math.max(0.002, 2 * r0 / (r0 + r1)), Math.max(0.002, 2 * r1 / (r0 + r1))], dir: o.dir ?? Math.PI / 2, fill: fill || o.fill,
      edge: [o.rib ?? 0, o.rib ?? 0, o.hoop ?? BOLD, o.hoop ?? BOLD], seed: ((o.seed || 0) + y0 * 0.01 + k * 0.07) % 1 }); }
}
// a flat disc of n wedges at height y (a lid, a rosette's face): wedges meet at the middle; each wedge is a triangle and
// prints the rim and ONE spoke (its second), at the whole width o.spoke asks of a spoke
export function disc(sh, T, n, y, r, pen, o = {}) {
  for (let k = 0; k < n; k++) { const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, m = T(0, y, 0);
    sh.quad(T(r * Math.cos(a0), y, r * Math.sin(a0)), T(r * Math.cos(a1), y, r * Math.sin(a1)), m, m, { pen: typeof pen === 'function' ? pen(k) : pen, dir: o.dir ?? 0, fill: o.fill, edge: [0, 2 * (o.spoke ?? 0), o.rim ?? BOLD, 0], seed: ((o.seed || 0) + k * 0.07) % 1, coats: o.coats,
      size: [2 * r * Math.sin(Math.PI / n) * Math.cos(Math.PI / n), r * Math.cos(Math.PI / n)] }); }
}

// a tapering quad's o.q: its width at a and b, and at c and d, each over the mean of the two
const taper = (a, b, c, d) => { const ab = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), dc = Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]); return [Math.max(0.002, 2 * ab / (ab + dc)), Math.max(0.002, 2 * dc / (ab + dc))]; };
// a racing dinghy, bow toward +z, about 30 m long with a 47 m mast: a hull of two sides, each folded once on its diagonal from the stem's foot to the stern's head (port the mirror of starboard), a mainsail of five panels
// and a jib of two (the boom overhangs the transom by 3.4 m). Local pens (1 to 8) are turned by the boat's own number (aInst.y). fills: by the boat's way (mode 3).
export function dinghy(sh, o = {}) {
  const T = frame(0, 0, 0), F = (a, b, cap = 1) => [a, b, cap, MODE.boat], hull = [[-6, 0, -13], [-7, 5, -14], [0, 0, 15], [0, 6, 17], [6, 0, -13], [7, 5, -14]];
  const [bl, tl, bb, tb, br, tr] = hull;
  sh.quad(bb, bl, tl, tb, { pen: 1, dir: 0, fill: F(0.05, 0.12), edge: [BOLD, BOLD, BOLD, BOLD] });              // starboard side (x under 0); its u0 is the stem
  sh.quad(bb, br, tr, tb, { pen: 1, dir: 0, coats: 2, fill: F(0.08, 0.12), edge: [BOLD, BOLD, BOLD, BOLD] });    // port side, the mirror of starboard; its u0 is the stem: each side prints its half of the stem's line
  sh.quad(bl, br, tr, tl, { pen: 1, dir: 0, coats: 2, fill: F(0.1, 0.1), edge: [BOLD, BOLD, BOLD, BOLD] });      // transom
  sh.quad(tl, tr, tb, tb, { pen: 0, edge: [0, 0, THIN, 0], size: [14, 31] });                                   // deck: a triangle; the gunwales' lines are the sides' own
  sh.quad([-0.5, 5, 2], [0.5, 5, 2], [0.5, 52, 1], [-0.5, 52, 1], { pen: 0, edge: [THIN, THIN, 0, THIN] });      // the mast: two crossed sheets a metre wide
  sh.quad([0, 5, 1.5], [0, 5, 2.5], [0, 52, 1.5], [0, 52, 0.5], { pen: 0, edge: [THIN, THIN, 0, THIN] });
  // the mainsail: luff up the mast, the boom aft; five panels from foot to head; the sail stands a little off the centre
  // line (the wind), its belly falling to nought at the head, which is a board 0.9 m wide
  const lean = o.lean ?? 3.2, P = 5;
  for (let k = 0; k < P; k++) { const y0 = 8 + (k / P) * 42, y1 = 8 + ((k + 1) / P) * 42, wd = (t) => 19 * (1 - t) + 0.9 * t, belly = (t) => lean * (Math.sin(Math.PI * t) + 0.5 * (1 - t)), w0 = wd(k / P), w1 = wd((k + 1) / P), b0 = belly(k / P), b1 = belly((k + 1) / P);
    const qa = [0.6, y0, 1.6], qb = [0.6 + b0, y0, 1.6 - w0], qc = [0.6 + b1, y1, 1.6 - w1], qd = [0.6, y1, 1.6];
    sh.quad(qa, qb, qc, qd, { pen: 2 + (k % 2) * 3, dir: 0, fill: F(0.18 + 0.1 * k, 0.12, k === 2 ? 0.75 : 1), edge: [BOLD, BOLD, k ? THIN : BOLD, k === P - 1 ? BOLD : THIN], q: taper(qa, qb, qc, qd), seed: 0.1 + 0.17 * k }); }
  // the jib: two panels that share their corners; its head an edge 1.1 m long (0.8 m aft and 0.8 m to starboard)
  { const lv = [[7, 15, 11, 1.6], [24, 8.5, 5.5, 1.2], [41, 2, 0.8, 0.8]];        // each level: height, the luff's z, the width aft, the leech's reach to starboard
    for (let k = 0; k < 2; k++) { const [y0, f0, w0, x0] = lv[k], [y1, f1, w1, x1] = lv[k + 1];
      const qa = [-0.6, y0, f0], qb = [-0.6 - x0, y0, f0 - w0], qc = [-0.6 - x1, y1, f1 - w1], qd = [-0.6, y1, f1];
      sh.quad(qa, qb, qc, qd, { pen: 7, dir: 0, fill: F(0.72 + 0.08 * k, 0.12), edge: [BOLD, BOLD, k ? THIN : BOLD, k ? BOLD : THIN], q: taper(qa, qb, qc, qd), seed: 0.6 + 0.2 * k }); } }
  return sh;
}
// a spinnaker: a bulging sail of three gores by three, set before the mast; a pen to each of its nine panels, coloured in a breath
export function spinnaker(sh) {
  const G = 3, R = 3, pt = (i, j) => { const u = i / G - 0.5, v = j / R, w = 22 * Math.sin(Math.PI * (0.12 + 0.88 * v) * 0.92) * (v < 0.5 ? 1 : 1.06 - 0.3 * (v - 0.5)); return [u * w * 1.25, 10 + v * 38, 16 + 11 * Math.cos(u * 2.6) * Math.sin(Math.PI * Math.min(1, 0.15 + v))]; };
  for (let i = 0; i < G; i++) for (let j = 0; j < R; j++) { const qa = pt(i, j), qb = pt(i + 1, j), qc = pt(i + 1, j + 1), qd = pt(i, j + 1);
    sh.quad(qa, qb, qc, qd, { pen: 1 + ((i * 3 + j * 2) % 8), dir: Math.PI / 2, fill: [0.02 + 0.05 * (i + j), 0.3, 1, MODE.boat], edge: [i ? THIN : BOLD, i === G - 1 ? BOLD : THIN, j ? THIN : BOLD, j === R - 1 ? BOLD : THIN], q: taper(qa, qb, qc, qd), seed: 0.3 + 0.11 * i + 0.07 * j }); }
  return sh;
}
