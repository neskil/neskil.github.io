// the-blank-answer, the part: the boards of the city (every wall of every block is a board of coloured cells), the
// rules that make them, and the summit gate's two boards: THE BLANK, an answer board that takes its colours while the
// street is flown, and the last board, whose great frame is the way out.
//
// THE FORMAT ONLY. A board is a grid of square cells in flat colours on black with thin joints. Every board, rule and
// game here is made by rule from the visit's seed (the generators below); not one is a task, a level or a game of any
// published set. No lettering of any kind stands in the place: no letter, no digit, no pixel lettering, no sign.
// THE COLOURS are ten, set by eye for this place and taken from no list: the blank cell's black and nine hues (PALETTE).
// The joint between cells and the far dark are shades of that black. NEVER are the ten laid as a row of five by
// two, at any size: no swatch of the palette stands anywhere, and no generator writes one (a board's cells come from a
// rule's shapes or from a carpet's bands: at most seven hues show on a board of the city at one time).
//
// HOW A BOARD IS DRAWN (boardMaterial). One texture holds every board's cells (the atlas: for each cell the hue before,
// the hue after and its turn in the board's own order). A board has one number p, 0 to 1: how far its rule has been
// found. A cell whose hue changes draws in to a point and grows again in its new hue when p reaches its turn; a cell whose hue
// after is HOLE is gone once turned (the arch's gate, a window: the inside of a frame). p comes from one of three
// laws, written on the board (aFill):
//   by PLACE   (span over 0)  p = (s - start) / span, s being the METRES OF ROUTE THE EYE HAS FLOWN; so a board is as
//                             far solved as the place the eye stands at says, at any pace, forward or back
//   by CLOCK   (span under 0) the place's own clock, the same with no visitor: the rule is found, held and let go again
//                             in a wave of -span seconds; start is the board's share of a wave (its phase)
//   SOLVED     (span 0)       p = 1
// Nothing is begun, ended, moved, lit, faded or hidden by a typed time, a share of the flight, a seed or the lens.
// A board is laid with one more number, dim: 1 its full face; under 1 a calmer or a shaded face (a block's end or
// top, the town), mixed toward the shade; over 1 a lit one (the lamps behind opened frames, the summit gate);
// written negative, the board is a double under the floor.
// NAMED AT THE HEAD (section 153): A FILTER BY A PIXEL'S FOOTPRINT. Where a cell is smaller than about two pixels the
// board is drawn in the mean of its cells (the mean before and the mean after, mixed by p), so a far town does not
// crawl; the footprint is the lesser of its two axes but never under six tenths of the greater, so a board seen at a
// slant keeps its cells longer than one far off; and a joint's edge is softened over one pixel. Both read the
// pixel's footprint (fwidth), nothing else. A BOARD'S BACK (which side of it the eye stands on) is drawn dark, its
// joints only. THE AIR: a far board sinks toward the night's far colour by its distance from the eye (one law of the
// air, the same at every place and on every seed). A board's double in the black glass of the floor is the same
// board laid under the floor, dimmer, sinking with its depth; the way out has NO double anywhere. The light a
// standing board lays on the glass before it (spill; one mesh, glow) is the mean of its cells by the board's own law.

import * as THREE from 'three';

export const HOLE = 255;
export const PALETTE = ['#131824', '#2B6BE4', '#E0463C', '#3DB65A', '#F4CF3A', '#BDB5A7', '#D84BC2', '#F0862E', '#6AC8EC', '#8E2140'];
const JOINT = '#272E3D';
export const FAR_DARK = '#080A10';
const JW = 0.07;                                   // the joint: seven hundredths of a cell on each side of a cell

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------------------------------------------
// THE RULES. Each makes one task of its own from a stream: a question grid, an answer grid and, for every cell of the
// answer, its turn (0 to 1) in the order in which the rule is seen being found. Row 0 is the foot of the board.
function grid(w, h) { return new Uint8Array(w * h); }
function hues(r, n, not = []) { const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => !not.includes(c)); r.shuffle(pool); return pool.slice(0, n); }

// a carpet: a field in which every cell is written, the same mirrored left to right and foot to head: bands of two
// measures of a cell's distance from the middle, taken through a short sequence of hues (and, now and then, the blank)
// (scale: the side of a band's step in cells; a giant board takes its carpet three cells to a step)
export function quilt(r, w, h, C, blank = 0.2, scale = 1) {
  const g = grid(w, h), L = r.int(4, 6), seq = [], F = [(a, b) => Math.max(a, b), (a, b) => a + b, (a, b) => Math.abs(a - b), (a, b) => Math.min(a, b)];
  for (let i = 0; i < L; i++) { let c = 0; for (let t = 0; t < 8; t++) { c = r() < blank ? 0 : C[r.int(0, C.length - 1)]; if (c !== seq[i - 1] && !(i === L - 1 && c === seq[0])) break; } seq.push(c); }
  const k1 = r.int(0, 3), k2 = (k1 + r.int(1, 3)) % 4, A = r.int(1, 2), B = r() < 0.25 ? 1 : 0, cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.floor(Math.abs(x - cx) / scale + 0.5 - 1e-9), b = Math.floor(Math.abs(y - cy) / scale + 0.5 - 1e-9); g[y * w + x] = seq[(A * F[k1](a, b) + B * F[k2](a, b)) % L]; }
  return g;
}

const RULES = {
  // a carpet is mended: two patches of it are blank, and each is written again from its mirrored twin
  mend(r, w, h) {
    const out = quilt(r, w, h, hues(r, 3)), inp = out.slice(), ord = new Float32Array(w * h), hw = Math.floor(w / 2), hh = Math.floor(h / 2);
    for (const [qx, qy] of r() < 0.5 ? [[0, 0], [1, 1]] : [[1, 0], [0, 1]]) { const pw = r.int(Math.max(2, hw - 4), hw - 1), ph = r.int(Math.max(2, hh - 4), hh - 1), x0 = qx ? w - hw + r.int(0, hw - pw) : r.int(0, hw - pw), y0 = qy ? h - hh + r.int(0, hh - ph) : r.int(0, hh - ph);
      for (let y = y0; y < y0 + ph; y++) for (let x = x0; x < x0 + pw; x++) { const i = y * w + x; inp[i] = 0; ord[i] = (qy ? 0.5 : 0) + 0.25 * ((x - x0) / pw + (y - y0) / ph); } }
    return { inp, out, ord };
  },
  // every hue takes the next: a carpet is written again with each of its hues turned to the next, from the middle outward
  turn(r, w, h) {
    const C = hues(r, 3), inp = quilt(r, w, h, C, 0.12), out = grid(w, h), ord = new Float32Array(w * h), cx = (w - 1) / 2, cy = (h - 1) / 2, far = Math.hypot(cx, cy) + 0.01, next = [];
    next[0] = 0; next[C[0]] = C[1]; next[C[1]] = C[2]; next[C[2]] = C[0];
    for (let i = 0; i < w * h; i++) { out[i] = next[inp[i]]; ord[i] = out[i] === inp[i] ? 0 : 0.04 + 0.9 * Math.hypot(i % w - cx, Math.floor(i / w) - cy) / far; }
    return { inp, out, ord };
  },
  // rings go on: the few rings round the middle are carried on, hue after hue, to the board's edge
  rings(r, w, h) {
    const inp = grid(w, h), out = grid(w, h), ord = new Float32Array(w * h), C = hues(r, r.int(3, 4)), cx = (w - 1) / 2, cy = (h - 1) / 2, top = Math.floor(Math.max(cx, cy)), k0 = Math.max(1, Math.floor(top / 3)), dm = r() < 0.35;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.floor(Math.abs(x - cx)), b = Math.floor(Math.abs(y - cy)), k = dm ? Math.min(top, Math.floor((a + b) * 0.75)) : Math.max(a, b), i = y * w + x;
      out[i] = C[k % C.length]; if (k <= k0) inp[i] = out[i]; else ord[i] = 0.04 + 0.96 * (k - k0 - 1 + 0.5 * r()) / Math.max(1, top - k0); }
    return { inp, out, ord };
  },
  // bands go on: slanting bands begun in one corner are carried on across the whole board
  stripe(r, w, h) {
    const inp = grid(w, h), out = grid(w, h), ord = new Float32Array(w * h), C = hues(r, 3), seq = [C[0], C[1], C[0], C[2]], bw = r.int(1, 2), up = r() < 0.5, top = w + h - 2, cut = Math.round(top * r.range(0.3, 0.45));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = up ? x + y : x + (h - 1 - y), i = y * w + x; out[i] = seq[Math.floor(v / bw) % 4]; if (v < cut) inp[i] = out[i]; else ord[i] = 0.04 + 0.96 * (v - cut) / Math.max(1, top - cut); }
    return { inp, out, ord };
  },
};

// ---------------------------------------------------------------------------------------------------------------
// THE BOARDS OF ONE VISIT: the atlas of cells, the one material and the one mesh that holds every board. Made anew by every build (nothing here is shared between two visits of the world).
export function makeBoards(opts = {}) {
  const N = 512, data = new Uint8Array(N * N * 4), pal = PALETTE.map((h) => new THREE.Color(h));
  let cx = 0, cy = 0, rowH = 0;
  const A = { pos: [], uv: [], rect: [], fill: [], ma: [], mb: [], idx: [], n: 0 };
  const jc = new THREE.Color(JOINT), share = (1 - 2 * JW) * (1 - 2 * JW);
  // a grid of cells into the atlas: before, after, turn; returns where it lies
  function put(w, h, before, after, ord) {
    if (cx + w > N) { cx = 0; cy += rowH; rowH = 0; }
    if (cy + h > N) throw new Error('the-blank-answer: the atlas is full');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = ((cy + y) * N + cx + x) * 4, i = y * w + x;
      data[q] = before[i]; data[q + 1] = after[i]; data[q + 2] = ord ? Math.round(255 * Math.min(1, Math.max(0, ord[i]))) : 0; data[q + 3] = 255; }
    const rect = { x: cx, y: cy, w, h, before, after }; cx += w; rowH = Math.max(rowH, h); return rect;
  }
  // one task by a named rule: its question (the same before and after) and its answer, which begins as the question's
  // copy and ends as the answer
  function task(kind, w, h, r) { const t = RULES[kind](r, w, h); return { w, q: put(w, h, t.inp, t.inp, null), a: put(w, h, t.inp, t.out, t.ord) }; }
  // the mean of a grid's cells, joints and all, with the board's own turn of the hues (perm)
  function mean(cells, perm) { const m = new THREE.Color(0, 0, 0);
    let n = 0; for (let i = 0; i < cells.length; i++) { const c = cells[i]; if (c === HOLE) continue; const k = c ? (c - 1 + perm) % 9 + 1 : 0; m.r += pal[k].r; m.g += pal[k].g; m.b += pal[k].b; n++; }
    if (n) m.multiplyScalar(share / n); return m.add(jc.clone().multiplyScalar(1 - share)); }
  // a board: o its lower left corner, ux and uy its two edges (whole lengths); seen from the side ux x uy points to.
  // fill: { start, span } as the head says; perm: a turn of the nine hues (0 to 8); dim: as the head says
  function board(rect, o, ux, uy, fill = {}, perm = 0, dim = 1) {
    const P = [o, o.clone().add(ux), o.clone().add(ux).add(uy), o.clone().add(uy)], UV = [[0, 0], [rect.w, 0], [rect.w, rect.h], [0, rect.h]];
    const ma = mean(rect.before, perm), mb = mean(rect.after, perm);
    for (let k = 0; k < 4; k++) { A.pos.push(P[k].x, P[k].y, P[k].z); A.uv.push(UV[k][0], UV[k][1]); A.rect.push(rect.x, rect.y, rect.w, rect.h);
      A.fill.push(fill.start ?? 0, fill.span ?? 0, perm, dim); A.ma.push(ma.r, ma.g, ma.b); A.mb.push(mb.r, mb.g, mb.b); }
    A.idx.push(A.n, A.n + 1, A.n + 2, A.n, A.n + 2, A.n + 3); A.n += 4;
  }
  // the same board laid under the floor (the black glass's double of it): mirrored in y, dimmer
  function doubled(rect, o, ux, uy, fill, perm, dim = 0.4) { const f = (v) => V(v.x, -v.y, v.z); board(rect, f(o), f(ux), f(uy), fill, perm, -dim); }
  // the light a standing board lays on the glass before it: a strip from the board's foot, `reach` metres out on the
  // side it faces, in the mean of its cells (by the same p as the board), fading with the distance from the foot
  const G = { pos: [], uv: [], fill: [], ma: [], mb: [], idx: [], n: 0 };
  function spill(rect, o, ux, uy, fill = {}, perm = 0, reach = 60, gain = 0.55) {
    const nrm = ux.clone().cross(uy).setY(0).normalize(), a = o.clone().setY(0.07), b = o.clone().add(ux).setY(0.07), ma = mean(rect.before, perm), mb = mean(rect.after, perm);
    const P = [a, b, b.clone().addScaledVector(nrm, reach), a.clone().addScaledVector(nrm, reach)], UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let k = 0; k < 4; k++) { G.pos.push(P[k].x, P[k].y, P[k].z); G.uv.push(UV[k][0], UV[k][1]); G.fill.push(fill.start ?? 0, fill.span ?? 0, gain); G.ma.push(ma.r, ma.g, ma.b); G.mb.push(mb.r, mb.g, mb.b); }
    G.idx.push(G.n, G.n + 1, G.n + 2, G.n, G.n + 2, G.n + 3); G.n += 4;
  }
  function glow() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(G.uv, 2)); g.setAttribute('aFill', new THREE.Float32BufferAttribute(G.fill, 3));
    g.setAttribute('aMA', new THREE.Float32BufferAttribute(G.ma, 3)); g.setAttribute('aMB', new THREE.Float32BufferAttribute(G.mb, 3)); g.setIndex(G.idx);
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec2 aUv; attribute vec3 aFill; attribute vec3 aMA; attribute vec3 aMB; uniform float uS; uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying vec3 vW;
        void main(){ float p = 1.;
          if (aFill.y > 0.) p = clamp((uS - aFill.x) / aFill.y, 0., 1.);
          else if (aFill.y < 0.) { float w = fract(uTime / -aFill.y - aFill.x); p = smoothstep(0., .3, w) - smoothstep(.62, .92, w); }
          vUv = aUv; vCol = mix(aMA, aMB, p) * aFill.z; vec4 w4 = modelMatrix * vec4(position, 1.); vW = w4.xyz; gl_Position = projectionMatrix * viewMatrix * w4; }`,
      fragmentShader: `uniform float uAir; varying vec2 vUv; varying vec3 vCol; varying vec3 vW;
        void main(){ float a = 1. - vUv.y; a = a * a * smoothstep(0., .12, vUv.x) * smoothstep(0., .12, 1. - vUv.x);
          gl_FragColor = vec4(vCol * a * exp(-length(vW - cameraPosition) * uAir), 1.); }` }));
    mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'glow'; return mesh;
  }
  const U = { tAtlas: { value: null }, uPal: { value: pal.map((c) => V(c.r, c.g, c.b)) }, uJoint: { value: jc }, uFar: { value: new THREE.Color(opts.far || FAR_DARK) },
    uS: { value: 0 }, uTime: { value: 0 }, uAir: { value: opts.air ?? 0.00075 }, uBack: { value: new THREE.Color('#12151B') }, uShade: { value: new THREE.Color(opts.shade || opts.far || FAR_DARK) } };
  function finish() {
    const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
    U.tAtlas.value = tex;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('aCell', new THREE.Float32BufferAttribute(A.uv, 2)); g.setAttribute('aRect', new THREE.Float32BufferAttribute(A.rect, 4));
    g.setAttribute('aFill', new THREE.Float32BufferAttribute(A.fill, 4)); g.setAttribute('aMA', new THREE.Float32BufferAttribute(A.ma, 3)); g.setAttribute('aMB', new THREE.Float32BufferAttribute(A.mb, 3));
    g.setIndex(A.n > 65535 ? new THREE.Uint32BufferAttribute(A.idx, 1) : A.idx);
    const mat = boardMaterial(U); mat.atlas = tex;                       // a plain property too, so the engine's clearing finds the texture
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'boards'; return mesh;
  }
  return { put, task, board, doubled, spill, finish, glow, uniforms: U, pal, count: () => A.n / 4, rows: () => cy + rowH };
}

function boardMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: `
      attribute vec2 aCell; attribute vec4 aRect; attribute vec4 aFill; attribute vec3 aMA; attribute vec3 aMB;
      uniform float uS; uniform float uTime;
      varying vec2 vCell; varying vec4 vRect; varying vec3 vK; varying vec3 vMean; varying vec3 vW;
      void main(){
        float p = 1.;
        if (aFill.y > 0.) p = clamp((uS - aFill.x) / aFill.y, 0., 1.);                       // by place: metres of route flown
        else if (aFill.y < 0.) { float w = fract(uTime / -aFill.y - aFill.x); p = smoothstep(0., .3, w) - smoothstep(.62, .92, w); }   // the place's own clock
        vCell = aCell; vRect = aRect; vK = vec3(p, aFill.z, aFill.w); vMean = mix(aMA, aMB, p);
        vec4 w4 = modelMatrix * vec4(position, 1.); vW = w4.xyz; gl_Position = projectionMatrix * viewMatrix * w4;
      }`,
    fragmentShader: `
      uniform sampler2D tAtlas; uniform vec3 uPal[10]; uniform vec3 uJoint; uniform vec3 uFar; uniform vec3 uBack; uniform vec3 uShade; uniform float uAir;
      varying vec2 vCell; varying vec4 vRect; varying vec3 vK; varying vec3 vMean; varying vec3 vW;
      // how much of a pixel a tile covers along one axis: d from the cell's middle, h the tile's half width, w the pixel's footprint
      // (a soft edge one pixel wide; where the pixel is wide, the tile's share of the cell)
      float cover(float d, float h, float w){ return mix(clamp((h - d) / w + .5, 0., 1.), 2. * h, smoothstep(.15, .6, w)); }
      void main(){
        vec2 fw2 = max(fwidth(vCell), vec2(1e-4));                                           // the pixel's footprint, in cells
        float fw = max(min(fw2.x, fw2.y), .6 * max(fw2.x, fw2.y));                            // (a board seen at a slant keeps its cells longer than one far off)
        vec2 ci = clamp(floor(vCell), vec2(0.), vRect.zw - 1.), f = vCell - ci;
        vec4 tx = textureLod(tAtlas, (vRect.xy + ci + .5) / 512., 0.);
        float a = floor(tx.r * 255. + .5), b = floor(tx.g * 255. + .5);
        float t = clamp((vK.x * 1.06 - tx.b) / .05, 0., 1.);                                  // this cell's turn: 0 before, 1 after
        if (vK.x >= 1.) t = 1.; if (vK.x <= 0.) t = 0.;
        float id = t < .5 ? a : b, sq = a == b ? 1. : abs(1. - 2. * t);                       // a changing tile draws in to a point at its half turn and grows again
        bool front = gl_FrontFacing == (vK.z > 0.);
        if (id > 200.) discard;                                                              // a hole: gone from its half turn on
        float k = id < .5 ? 0. : floor(mod(id - .5 + floor(vK.y + .5), 9.)) + 1.;            // the hue after the board's turn of the nine: 1 to 9 (worked half a step off the whole numbers)
        vec3 col = uPal[int(clamp(k, 0., 9.) + .5)];
        vec2 d = abs(f - .5); float hx = (.5 - ${JW.toFixed(2)}) * max(sq, .04), hy = hx;
        float inside = cover(d.x, hx, fw2.x) * cover(d.y, hy, fw2.y);
        vec3 c = mix(uJoint, col, inside);
        c = mix(c, vMean, smoothstep(.3, .9, fw));                                            // under two pixels a cell: the board's mean
        if (!front) c = mix(uBack, uJoint, 1. - inside);                                      // a board's back: dark cells, the joints only
        float dim = abs(vK.z); if (vK.z < 0.) dim *= exp(min(vW.y, 0.) / 46.);                // a double sinks with its depth
        c = mix(uShade, c, dim);                                                              // a shaded face: a block's end or top; a double
        gl_FragColor = vec4(mix(uFar, c, exp(-length(vW - cameraPosition) * uAir)), 1.);      // the air
      }` });
}

// ---------------------------------------------------------------------------------------------------------------
// THE LAST RULE (the arch's, the pyramid's and every window's too): what a closed frame holds is opened. A question: a carpet and, set
// in it with a blank cell all round, one closed frame (hue fc) that holds a jumble (the two hues J). Its answer: the
// same, and the frame's inside is a HOLE. door: the low left cell of the frame's inside;
// k: the inside's side in cells; scale: the carpet's step. The order in which an answer is found: its frame, then the
// carpet outward from the frame.
export function frameTask(r, w, h, door, k, fc, J, scale = 1, not = []) {
  const inp = quilt(r, w, h, hues(r, 3, [fc, J[0], J[1]].concat(not)), 0.28, scale), out = inp.slice(), ord = new Float32Array(w * h);
  const dx = door[0], dy = door[1], mx = dx + (k - 1) / 2, my = dy + (k - 1) / 2, far = Math.hypot(Math.max(mx, w - 1 - mx), Math.max(my, h - 1 - my));
  for (let i = 0; i < w * h; i++) ord[i] = 0.12 + 0.86 * Math.hypot(i % w - mx, Math.floor(i / w) - my) / far;
  for (let Y = dy - 2; Y <= dy + k + 1; Y++) for (let X = dx - 2; X <= dx + k + 1; X++) { if (X < 0 || X >= w || Y < 0 || Y >= h) continue; const q = Y * w + X, edge = X === dx - 1 || X === dx + k || Y === dy - 1 || Y === dy + k;
    if (X < dx - 1 || X > dx + k || Y < dy - 1 || Y > dy + k) { inp[q] = 0; out[q] = 0; continue; }
    if (edge) { inp[q] = fc; out[q] = fc; ord[q] = 0.02 + 0.06 * (Math.atan2(X - mx, Y - my) / (2 * Math.PI) + 0.5); } else { inp[q] = r() < 0.85 ? J[r.int(0, 1)] : 0; out[q] = HOLE; ord[q] = 0.1; } }
  return { inp, out, ord };
}

// THE SUMMIT GATE's two boards, laid into a visit's boards. C: the middle of the great frame of the back board (the
// course comes to it from +Z, heading -Z). They are of one size (LAST.w cells by LAST.h of LAST.cell metres) and
// stand LAST.deep metres apart.
//   THE BLANK, the front board, looks toward -Z (the street). Its cells are coarse (LAST.front: half as many each
//     way, twice the side), to be read from the street's far end. It is the answer's own carpet, uncoloured (its
//     bands in the two pale hues), lit, with its border and its great frame; the frame's inside is a field of lamps
//     (LAST.front.lamp) at every metre: a lit blank, no opening. Its colours come by the law fillBlank (the world
//     gives it: BY PLACE).
//   THE LAST BOARD, the back board, looks toward +Z: a carpet and, set in it, closed frames each holding a jumble;
//     by the law fillBack (BY PLACE) the small frames are opened. The great frame's inside, LAST.k cells by LAST.k
//     from the second row up, is a HOLE at every metre: the way out (the engine's own opening stands behind it);
//     its frame and the board's border stand at every metre.
// Neither has a double: they stand on the pyramid's summit, not on the glass.
export const LAST = { w: 42, h: 34, cell: 4.8, scale: 2, door: [14, 1], k: 14, pale: [5, 8], glow: 1.2, deep: 40, front: { w: 21, h: 17, door: [7, 1], k: 7, lamp: [4, 5] } };
export function laySummit(sys, r, C, fillBlank = {}, fillBack = {}) {
  const { w, h, cell: cs, k, deep } = LAST, [dx, dy] = LAST.door, wide = w * cs, tall = h * cs, foot = C.y - (dy + k / 2) * cs, [fc, j0, j1] = hues(r, 3, LAST.pale), J = [j0, j1], uy = V(0, tall, 0);
  const rim = (X, Y) => X === 0 || X === w - 1 || Y === 0 || Y === h - 1, inDoor = (X, Y) => X >= dx && X < dx + k && Y >= dy && Y < dy + k;
  // the blank: of coarser cells (two of the last board's to a side), to be read from the street's far end
  { const F = LAST.front, fw = F.w, fh = F.h, [fx, fy] = F.door, fk = F.k, t = frameTask(r, fw, fh, F.door, fk, fc, J, 1, LAST.pale), before = grid(fw, fh), seen = [];
    for (let Y = 0; Y < fh; Y++) for (let X = 0; X < fw; X++) { const q = Y * fw + X;
      if (X >= fx && X < fx + fk && Y >= fy && Y < fy + fk) { const c = F.lamp[r() < 0.5 ? 0 : 1]; t.out[q] = c; before[q] = c; continue; }
      if (X === 0 || X === fw - 1 || Y === 0 || Y === fh - 1) { t.out[q] = fc; before[q] = fc; continue; }
      const c = t.out[q]; if (c === fc) { before[q] = fc; continue; } if (!c) continue;
      let n = seen.indexOf(c); if (n < 0) n = seen.push(c) - 1; before[q] = LAST.pale[n % 2]; }
    sys.board(sys.put(fw, fh, before, t.out, t.ord), V(C.x + wide / 2, foot, C.z - deep), V(-wide, 0, 0), uy, fillBlank, 0, LAST.glow); }
  const of = V(C.x + wide / 2, foot, C.z - deep), uf = V(-wide, 0, 0);
  // the last board
  const b = frameTask(r, w, h, LAST.door, k, fc, J, LAST.scale, LAST.pale), bb = b.inp, ba = b.out, ord = new Float32Array(w * h), frames = [[dx, dy, k]];
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) { const q = Y * w + X; if (inDoor(X, Y)) { bb[q] = HOLE; ba[q] = HOLE; } else if (rim(X, Y)) { bb[q] = fc; ba[q] = fc; } }
  for (let tries = 0; tries < 300 && frames.length < 9; tries++) { const kk = r.int(3, 4), x = r.int(3, Math.floor(w / 2) - kk - 3), y = r.int(3, h - kk - 4);
    if (frames.some(([fx, fy, fk]) => x < fx + fk + 3 && fx < x + kk + 3 && y < fy + fk + 3 && fy < y + kk + 3)) continue; frames.push([x, y, kk], [w - x - kk, y, kk]); }
  frames.slice(1).forEach(([x, y, kk], f) => { const turn = 0.08 + 0.8 * r();
    for (let Y = y - 2; Y <= y + kk + 1; Y++) for (let X = x - 2; X <= x + kk + 1; X++) { const q = Y * w + X;
      if (X < x - 1 || X > x + kk || Y < y - 1 || Y > y + kk) { bb[q] = 0; ba[q] = 0; continue; }
      if (X === x - 1 || X === x + kk || Y === y - 1 || Y === y + kk) { bb[q] = fc; ba[q] = fc; continue; }
      bb[q] = r() < 0.85 ? J[r.int(0, 1)] : 0; ba[q] = HOLE; ord[q] = turn + 0.1 * (f % 2); } });
  const ob = V(C.x - wide / 2, foot, C.z), ub = V(wide, 0, 0);
  sys.board(sys.put(w, h, bb, ba, ord), ob, ub, uy, fillBack, 0, LAST.glow);
  const bodies = [[of.clone(), uf.clone(), uy.clone(), null], [ob.clone(), ub.clone(), uy.clone(), [dx / w, (dx + k) / w, dy / h, (dy + k) / h]]];
  return { bodies, lines: [[of.x, of.z, of.x + uf.x, of.z], [ob.x, ob.z, ob.x + ub.x, ob.z]], door: { half: k * cs / 2 }, side: wide, tall, foot, fc, J };
}
export async function buildHero(ctx) {
  const r = ctx.core.makeRng(ctx.core.hashSeed('the-blank-answer:last:' + ctx.seed));
  const sys = makeBoards(), C = V(0, (LAST.door[1] + LAST.k / 2) * LAST.cell, 0);
  const last = laySummit(sys, r, C);
  const mesh = sys.finish(), light = sys.glow(), object = new THREE.Group(); mesh.rotation.y = Math.PI; light.rotation.y = Math.PI; object.add(mesh, light);
  return { object, radius: 130, height: 164, center: V(0, 80, 0), anchors: { portal: V(-C.x, C.y, -C.z) },
    update(dt, time) { sys.uniforms.uTime.value = time; }, dispose() {}, ground: false, groundY: 0, last };
}
