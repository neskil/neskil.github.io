// Hero set piece for "The Chamak Road": THE RIVER OF JEWELS.
// A 410 m suspension bridge (three times life size) whose deck is filled with forty jingle trucks
// crawling nose to tail, every surface hammered tin, enamel paint and cut reflective tape. Nothing
// here emits light: the whole piece is one retroreflective shader family that answers a pair of
// headlights (uniforms below), so it is black crowns on indigo until a beam reaches it and then it
// burns in red, green, gold, blue and white. The wet deck doubles everything that is lit.
//
// LOCAL FRAME   origin = midspan, road surface (y = 0). The bridge runs along Z. The camera arrives
//               from +Z (near tower at z = +205) and leaves through the far tower (z = -205), whose
//               horseshoe arch frames the exit portal. Trucks use the lane x = +3.6 (the camera's
//               right-hand side) and drive toward +Z. The river is about 90 m below (groundY = -90).
// SIZE          radius 290 (span + backstays), height 50 above the deck, piers 16 m below it.
//               (hero.span = { length: 410, deckWidth: 12, towerHeight: 46 }.)
// COST          about 81k triangles, 7 draw calls, 5 shader programs, 2 canvas atlases (2048 + 1024), no lights.
// LIGHTING      No scene lights are used. Pass opts.beam = { uEye, uBeamPos, uBeamDir, uBeamGain }
//               (three.js uniform objects, WORLD space: eye, the two lamp positions, the unit beam
//               direction, gain) to share the world's headlight uniforms; the cone and range then
//               follow the brief (14 deg long lobe to 110..150 m, 62 deg flood to 35 m). Without
//               opts.beam the piece lights itself from the camera given to update() with a wide
//               "showcase" torch whose range follows the camera's distance (for the part viewer).
//               hero.uniforms exposes every shared uniform (uSkyFill, uGlowCol, uGlowDir, uBeamLong,
//               uBeamFlood, uTapeGain, uArch, uFan ...). Scene fog is honoured.
// OPTS          palette      7 hex strings (night, mauve, red, green, gold, blue, white)
//               beam         shared headlight uniforms (see above)
//               afterglowDir world-space direction TOWARD the mauve afterglow (default: 35 deg left of -Z)
//               trucks       number of trucks (default 40)
//               laneAt(d)    optional: d = metres beyond the near tower along the trucks' lane
//                            (d > 0 is off the bridge, toward the bend); return { x, y, z, heading }
//                            in local space so trucks follow the world's road once they leave the span.
//               convoy       'mixed' | 'warm' | 'cool' colour cast (default: chosen by seed)
//               parked       [{ x, y, z, heading }] extra trucks that stand still (no wheel spin, spray or rock),
//                            drawn in the same instanced call after the convoy
//               world        true: also build the materials a world dresses its road with (hero.kit.mats:
//                            mirrorOpen = flattened additive reflection with no deck clip, mirrorGorge = the same
//                            (one law of fall-off for both since round 6; uMirFade is no longer read), cutout = motifs with
//                            the tile's black ground cut away and eyes whose lids close, roadPath = the wet road
//                            shader for a ribbon whose uv is (lateral, distance)); uMirrorK, uWetK and uSnowK tune them
//               view         'whole' | a close view name, for the part viewer only (no URL is read here)
//               hero.kit     { mats, tex, makeAcc, T, GLSL_BEAM }: the mesh accumulator, tile table, atlases and
//                            beam GLSL, so a world can paint its own things in exactly this family
// PROGRESS      hero.setTravel(s)   s = metres the camera has travelled along the brief's 800 m path
//                                   (near tower at s = 390, far tower / portal at s = 800). Truck k sits
//                                   at path distance 398.6 + 13 k - (6/21) s, so the head of the convoy
//                                   meets the camera at s = 310 and the tail at s = 703 at any flight
//                                   speed. Until setTravel is called the convoy loops on wall-clock
//                                   time (viewer mode).
//               hero.setProgress(u) the same with u = 0..1 over the 800 m path.
//               hero.setArch(a)     0..1 ignition of the far arch's mosaic, sill first, rising round the
//                                   horseshoe to the peacock fan over the keystone. If never called it
//                                   follows the eye's distance to the far tower (150 m -> 0, 25 m -> 1).
//               Peacock tails fan open by eye distance (uniform uFan = (farDist, nearDist), 70 and 14 m).
// VIEWER        The returned radius / height / center are framing hints chosen by
//               opts.view = mid | near | arch | whole (default) | drive | approach; "drive" and "approach" put the
//               u = 0.1 frame on the free lane at eye height under the brief's true headlights. Outside the
//               part viewer the honest size (radius 290, height 50) is returned; hero.span always has it.
// ANCHORS (local space)
//               portalSeat   { position (0, 3, -205), facing (0, 0, 1), radius 7 }: the 14 m portal, centred
//                            3 m above the deck in the far horseshoe; its lowest 4 m is masked by the deck.
//               flyThrough   ordered points down the free lane (x = 0, eye 3 m above the deck) from 60 m
//                            before the near tower to the portal; truck flanks pass 2.1 m to the right as the
//                            brief asks, handrail 5.8 m to the left, arch soffit 7.3 m around the portal centre.
//               bend         { centre, radius 130, sweep }: the brief's 35 degree right-hand bend that ends at the
//                            near tower; the default laneAt() carries departing trucks round it.
//               nearArch, farArch   arch centres;  entry  the point where the causeway meets the deck
//               viewpoints   reveal (from the bend), midspan, approach (last 4 s)
//               truckLane    { x, from, to }; owlPerch  a hanger top near s = 520; river  a point below midspan
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#0A0E26', '#3A2C5C', '#E3122B', '#0FAE4B', '#FFC21A', '#1560F0', '#F4F8FF'];
const HALF = 205, DECK_W = 6, CABLE_X = 6.35, TOWER_H = 46, ARCH_R = 7.3, ARCH_Y = 3.3, LANE_X = 3.6;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------------------------------------
// Mesh accumulator: non-indexed triangles with the attributes the jewel shader needs.
//   aFx  = (tile, gate, kind, param)   tile >= 0 atlas tile, 100 + slot = per-instance tile slot,
//                                      -1 enamel (vertex colour), -2 tape (vertex colour), -3 dull black,
//                                      -4 body enamel (instance colour)
//   aPiv = (pivot xyz, phase)          kind 1 wheel, 2 feather, 3 dangling chain, 4 ribbon, 5 pennant
// ------------------------------------------------------------------------------------------------
function makeAcc() {
  const pos = [], nor = [], uv = [], fx = [], piv = [], col = [];
  const st = { tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] };
  let M = new THREE.Matrix4(); const stack = [];
  const N3 = new THREE.Matrix3();
  const tv = new THREE.Vector3(), tn = new THREE.Vector3(), tp = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
  // elements, for the mirrors' law of drawing out: els holds the first vertex of every thing laid. A thing is one primitive call
  // (tri, quad, box, panel, lathe), a raw run of vertices under one set(), or all that is laid between thing(true) and thing(false)
  const els = []; let elDepth = 0, elHold = false, elFresh = true;
  const elOpen = () => { if (elDepth++ === 0 && !elHold) els.push(pos.length / 3); }, elClose = () => { if (--elDepth === 0) elFresh = true; };
  const G = {
    st,
    set(o) { Object.assign(st, o); elFresh = true; return G; },
    thing(on) { if (on) { els.push(pos.length / 3); elHold = true; } else { elHold = false; elFresh = true; } },
    push(m) { stack.push(M.clone()); M = M.clone().multiply(m); N3.getNormalMatrix(M); },
    pop() { M = stack.pop(); N3.getNormalMatrix(M); },
    at(x, y, z, ry = 0, s = 1) { G.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s))); },
    v(p, n, u, w, gate) {
      if (elFresh) { if (!elDepth && !elHold) els.push(pos.length / 3); elFresh = false; }
      tv.set(p[0], p[1], p[2]).applyMatrix4(M); tn.set(n[0], n[1], n[2]).applyMatrix3(N3).normalize();
      pos.push(tv.x, tv.y, tv.z); nor.push(tn.x, tn.y, tn.z); uv.push(u, w);
      fx.push(st.tile, gate === undefined ? st.gate : gate, st.kind, st.param);
      const kd = st.kind;
      if (kd === 0 || kd === 7) piv.push(0, 0, 0, st.pivot[3]);      // only kinds 1-4 and 6 read the pivot
      else if (kd === 5) piv.push(st.pivot[0], st.pivot[1], 0, st.pivot[3]);      // a pennant laid by columns (6e): (1, the vertex's place across its column, -1 to 1); else zeros
      else { tp.set(st.pivot[0], st.pivot[1], st.pivot[2]); if (kd !== 4) tp.applyMatrix4(M); else tp.transformDirection(M); piv.push(tp.x, tp.y, tp.z, st.pivot[3]); }
      col.push(st.tint[0], st.tint[1], st.tint[2]);
    },
    faceN(a, b, c) { e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); fn.crossVectors(e1, e2); const l = fn.length() || 1; return [fn.x / l, fn.y / l, fn.z / l]; },
    tri(a, b, c, ua = [0, 0], ub = [1, 0], uc = [0.5, 1], n) { n = n || G.faceN(a, b, c); elOpen(); G.v(a, n, ua[0], ua[1]); G.v(b, n, ub[0], ub[1]); G.v(c, n, uc[0], uc[1]); elClose(); },
    // a = bottom-left, b = bottom-right, c = top-right, d = top-left (counter-clockwise from the front)
    quad(a, b, c, d, r = [0, 0, 1, 1], g) {
      const n = G.faceN(a, b, d[0] === a[0] && d[1] === a[1] && d[2] === a[2] ? c : d);
      const ga = g ? g[0] : undefined, gb = g ? g[1] : undefined, gc = g ? g[2] : undefined, gd = g ? g[3] : undefined;
      elOpen(); G.v(a, n, r[0], r[1], ga); G.v(b, n, r[2], r[1], gb); G.v(c, n, r[2], r[3], gc);
      G.v(a, n, r[0], r[1], ga); G.v(c, n, r[2], r[3], gc); G.v(d, n, r[0], r[3], gd); elClose();
    },
    quadN(a, b, c, d, na, nb, nc, nd, r = [0, 0, 1, 1]) {
      elOpen(); G.v(a, na, r[0], r[1]); G.v(b, nb, r[2], r[1]); G.v(c, nc, r[2], r[3]);
      G.v(a, na, r[0], r[1]); G.v(c, nc, r[2], r[3]); G.v(d, nd, r[0], r[3]); elClose();
    },
    // axis-aligned box, centre + size; faces: which to emit ('xXyYzZ' = -x +x -y +y -z +z); tiles per face keep the current tile
    box(cx, cy, cz, sx, sy, sz, faces = 'xXyYzZ', r) {
      const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2; elOpen();
      if (faces.includes('Z')) G.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], r);
      if (faces.includes('z')) G.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], r);
      if (faces.includes('X')) G.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], r);
      if (faces.includes('x')) G.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], r);
      if (faces.includes('Y')) G.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], r);
      if (faces.includes('y')) G.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], r);
      elClose();
    },
    // a raised, bevelled panel standing on a plane: origin o, right vector ux, up vector uy, normal n, size w x h, relief d
    panel(o, ux, uy, n, w, h, d, bev, r) {
      const P = (a, b, c) => [o[0] + ux[0] * a + uy[0] * b + n[0] * c, o[1] + ux[1] * a + uy[1] * b + n[1] * c, o[2] + ux[2] * a + uy[2] * b + n[2] * c];
      const a0 = P(0, 0, 0), b0 = P(w, 0, 0), c0 = P(w, h, 0), d0 = P(0, h, 0);
      const a1 = P(bev, bev, d), b1 = P(w - bev, bev, d), c1 = P(w - bev, h - bev, d), d1 = P(bev, h - bev, d);
      elOpen(); G.quad(a1, b1, c1, d1, r);
      const keep = st.tile; st.tile = -3;
      G.quad(a0, b0, b1, a1); G.quad(b0, c0, c1, b1); G.quad(c0, d0, d1, c1); G.quad(d0, a0, a1, d1);
      st.tile = keep; elClose();
    },
    // surface of revolution about +Y at (cx, cy, cz); prof = [[r, y], ...] bottom to top; smooth normals
    lathe(cx, cy, cz, prof, segs, uRep = 1) {
      elOpen();
      for (let i = 0; i < prof.length - 1; i++) {
        const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
        const dl = Math.hypot(r1 - r0, y1 - y0) || 1, ny = -(r1 - r0) / dl, nr = (y1 - y0) / dl;
        for (let s = 0; s < segs; s++) {
          const a0 = (s / segs) * TAU, a1 = ((s + 1) / segs) * TAU;
          const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          const A = [cx + c0 * r0, cy + y0, cz + s0 * r0], B = [cx + c1 * r0, cy + y0, cz + s1 * r0];
          const C = [cx + c1 * r1, cy + y1, cz + s1 * r1], D = [cx + c0 * r1, cy + y1, cz + s0 * r1];
          const n0 = [c0 * nr, ny, s0 * nr], n1 = [c1 * nr, ny, s1 * nr];
          const u0 = (s / segs) * uRep, u1 = ((s + 1) / segs) * uRep, v0 = i / (prof.length - 1), v1 = (i + 1) / (prof.length - 1);
          if (r0 < 1e-4) { G.v(B, n1, u1, v0); G.v(D, n0, u0, v1); G.v(C, n1, u1, v1); }
          else if (r1 < 1e-4) { G.v(B, n1, u1, v0); G.v(A, n0, u0, v0); G.v(D, n0, u0, v1); }
          else G.quadN(B, A, D, C, n1, n0, n0, n1, [u1, v0, u0, v1]);
        }
      }
      elClose();
    },
    count() { return pos.length / 9; },
    // aEl = (centre height, half height run) of the element each vertex belongs to, read off the laid positions
    elArray() {
      const n = pos.length / 3, a = new Float32Array(n * 2);
      for (let k = 0; k < els.length; k++) {
        const i0 = els[k], i1 = k + 1 < els.length ? els[k + 1] : n; let lo = Infinity, hi = -Infinity;
        for (let i = i0; i < i1; i++) { const y = pos[i * 3 + 1]; if (y < lo) lo = y; if (y > hi) hi = y; }
        const c = (lo + hi) / 2, h = (hi - lo) / 2; for (let i = i0; i < i1; i++) { a[i * 2] = c; a[i * 2 + 1] = h; }
      }
      return a;
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(fx, 4));
      g.setAttribute('aPiv', new THREE.Float32BufferAttribute(piv, 4));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      return g;
    },
    // the same geometry in six short steps, one attribute each (a generator: each yield is a place to hand the page back);
    // el: the buffer will be mirrored, so it carries aEl too (a seventh step)
    *geometrySteps(el) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); yield;
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); yield;
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); yield;
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(fx, 4)); yield;
      g.setAttribute('aPiv', new THREE.Float32BufferAttribute(piv, 4)); yield;
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      if (el) { yield; g.setAttribute('aEl', new THREE.BufferAttribute(G.elArray(), 2)); }
      return g;
    },
  };
  return G;
}

// ------------------------------------------------------------------------------------------------
// Motif atlas: 64 tiles drawn with canvas paths. Colour canvas (sRGB paint / tape colour) and a
// half-size data canvas (R = cut-tape mask, G = emboss height). No lettering anywhere: motifs only.
// Tiles: 0-13 flowers, 14-15 hearts, 16-21 peacocks, 22-23 tail feathers, 24-31 fish, 32-39 eyes,
//        40-45 partridges, 46-51 cypresses, 52-57 sunbursts, 58-63 mosaic fields (diamonds, scallops,
//        chevrons, kerb checks, diagonal stripes, red/white/green bands).
// ------------------------------------------------------------------------------------------------
const T = { flower: [0, 14], heart: [14, 2], peacock: [16, 6], feather: [22, 2], fish: [24, 8], eye: [32, 8], bird: [40, 6], cypress: [46, 6], sun: [52, 6], diamonds: 58, scallops: 59, chevrons: 60, checks: 61, stripes: 62, bands: 63 };

async function makeAtlas(ctx, pal, cast) {
  const rng = ctx.rng.fork('atlas');
  const SA = 2048, SB = 1024, NT = 8;
  const ca = document.createElement('canvas'); ca.width = ca.height = SA;
  const cb = document.createElement('canvas'); cb.width = cb.height = SB;
  const A = ca.getContext('2d'), B = cb.getContext('2d');
  const K = '#04050a', R = pal[2], Gn = pal[3], Y = pal[4], Bl = pal[5], W = pal[6];
  A.fillStyle = K; A.fillRect(0, 0, SA, SA); B.fillStyle = 'rgb(0,50,0)'; B.fillRect(0, 0, SB, SB);
  const both = [A, B];
  const dat = (tape, h) => 'rgb(' + Math.round(tape * 255) + ',' + Math.round(h * 255) + ',0)';
  const fill = (fn, col, tape = 0, h = 0.7) => { for (let i = 0; i < 2; i++) { const c = both[i]; c.beginPath(); fn(c); c.fillStyle = i ? dat(tape, h) : col; c.fill(); } };
  const stroke = (fn, col, w, tape = 0, h = 0.7) => { for (let i = 0; i < 2; i++) { const c = both[i]; c.beginPath(); fn(c); c.strokeStyle = i ? dat(tape, h) : col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); } };
  const circ = (x, y, r) => (c) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); };
  const ell = (x, y, rx, ry, rot = 0) => (c) => { c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const poly = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
  const rect = (x0, y0, x1, y1) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  // teardrop petal from (x, y) pointing along ang
  const petal = (x, y, ang, len, wid, sharp = 0.55) => (c) => {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    c.moveTo(x, y);
    c.quadraticCurveTo(x + dx * len * sharp + px * wid, y + dy * len * sharp + py * wid, x + dx * len, y + dy * len);
    c.quadraticCurveTo(x + dx * len * sharp - px * wid, y + dy * len * sharp - py * wid, x, y);
  };
  const line = (x0, y0, x1, y1) => (c) => { c.moveTo(x0, y0); c.lineTo(x1, y1); };
  const heart = (x, y, s) => (c) => { c.moveTo(x, y - s * 0.9); c.bezierCurveTo(x - s * 1.5, y, x - s * 0.9, y + s * 1.25, x, y + s * 0.45); c.bezierCurveTo(x + s * 0.9, y + s * 1.25, x + s * 1.5, y, x, y - s * 0.9); };
  const pools = { mixed: [R, Gn, Y, Bl], warm: [R, Y, R, Y, Gn], cool: [Bl, Gn, Bl, Gn, Y] };
  const colours = (r) => { const s = r.shuffle(pools[cast].slice()); const out = [s[0]]; for (const c of s) if (!out.includes(c)) out.push(c); while (out.length < 4) out.push(W); return out; };
  const begin = (t) => {
    const cx = t % NT, cy = Math.floor(t / NT);
    for (let i = 0; i < 2; i++) {
      const c = both[i], s = (i ? SB : SA) / NT;
      c.save(); c.beginPath(); c.rect(cx * s, cy * s, s, s); c.clip();
      c.setTransform(s / 2, 0, 0, -s / 2, (cx + 0.5) * s, (cy + 0.5) * s);
    }
  };
  const end = () => { A.restore(); B.restore(); };
  const xf = (fn) => { for (const c of both) { c.save(); fn(c); } };
  const unxf = () => { for (const c of both) c.restore(); };

  const frame = (r, cs) => {
    const k = r.int(0, 3), c = cs[r.int(1, 3)];
    if (k === 0) { fill(rect(-0.95, -0.95, 0.95, 0.95), c, 1, 0.55); fill(rect(-0.86, -0.86, 0.86, 0.86), W, 1, 0.5); fill(rect(-0.82, -0.82, 0.82, 0.82), K, 0, 0.2); }
    else if (k === 1) { for (let i = 0; i < 8; i++) { const p = -0.84 + i * 0.24; for (const [x, y] of [[p, 0.9], [p, -0.9], [0.9, p], [-0.9, p]]) fill(poly([[x, y - 0.075], [x + 0.1, y], [x, y + 0.075], [x - 0.1, y]]), i % 2 ? c : W, 1, 0.6); } }
    else if (k === 2) { for (let i = 0; i < 7; i++) { const p = -0.78 + i * 0.26; for (const [x, y, a] of [[p, 0.97, -1.5708], [p, -0.97, 1.5708], [0.97, p, 3.1416], [-0.97, p, 0]]) fill((q) => { q.moveTo(x, y); q.arc(x, y, 0.12, a - 1.5708, a + 1.5708); q.closePath(); }, i % 2 ? c : cs[0], 1, 0.6); } }
    else { fill(rect(-0.95, -0.95, 0.95, 0.95), c, 1, 0.55); fill(rect(-0.88, -0.88, 0.88, 0.88), K, 0, 0.2); for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) fill(poly([[sx * 0.88, sy * 0.88], [sx * 0.5, sy * 0.88], [sx * 0.88, sy * 0.5]]), W, 1, 0.6); }
  };
  const flower = (r) => {
    const cs = colours(r); frame(r, cs);
    const n = r.pick([5, 6, 8, 8, 10, 12]), sharp = r.range(0.45, 0.75), a0 = r() * TAU, two = r.chance(0.6);
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { fill(petal(sx * 0.74, sy * 0.74, Math.atan2(-sy, -sx) + 0.5, 0.3, 0.11), Gn, 0, 0.6); fill(petal(sx * 0.74, sy * 0.74, Math.atan2(-sy, -sx) - 0.5, 0.3, 0.11), Gn, 1, 0.6); fill(circ(sx * 0.72, sy * 0.72, 0.06), Y, 1, 0.8); }
    for (let i = 0; i < n; i++) fill(petal(0, 0, a0 + (i / n) * TAU, 0.7, 2.4 / n + 0.06, sharp), cs[0], i % 2 ? 1 : 0, 0.75);
    for (let i = 0; i < n; i++) stroke(line(0, 0, Math.cos(a0 + (i / n) * TAU) * 0.5, Math.sin(a0 + (i / n) * TAU) * 0.5), W, 0.022, 1, 0.9);
    if (two) for (let i = 0; i < n; i++) fill(petal(0, 0, a0 + ((i + 0.5) / n) * TAU, 0.42, 1.6 / n + 0.04, 0.6), cs[1], i % 2 ? 0 : 1, 0.85);
    fill(circ(0, 0, 0.19), cs[2] === cs[0] ? W : cs[2], 1, 0.95); fill(circ(0, 0, 0.1), cs[3], 0, 1);
    for (let i = 0; i < 8; i++) fill(circ(Math.cos(i * 0.785) * 0.145, Math.sin(i * 0.785) * 0.145, 0.022), K, 0, 0.8);
  };
  const heartTile = (r) => { const cs = colours(r); frame(r, cs); fill(heart(0, -0.05, 0.55), W, 1, 0.7); fill(heart(0, -0.05, 0.47), R, 1, 0.85); fill(heart(0, -0.02, 0.24), Y, 0, 0.95); for (let i = 0; i < 6; i++) fill(circ(Math.cos(i * 1.047 + 0.52) * 0.72, Math.sin(i * 1.047 + 0.52) * 0.72, 0.05), cs[1], 1, 0.8); };
  const featherEye = (x, y, s, rot) => { xf((c) => { c.translate(x, y); c.rotate(rot); }); fill(ell(0, 0, s, s * 1.3), Gn, 1, 0.8); fill(ell(0, -s * 0.05, s * 0.68, s * 0.92), Y, 1, 0.9); fill(ell(0, -s * 0.12, s * 0.42, s * 0.56), Bl, 0, 0.95); fill(ell(0, -s * 0.2, s * 0.18, s * 0.24), K, 0, 0.8); unxf(); };
  const peacock = (r) => {
    const cs = colours(r); frame(r, cs); const n = r.pick([7, 9, 9, 11]);
    for (let i = 0; i < n; i++) { const a = 0.12 + (i / (n - 1)) * (Math.PI - 0.24), dx = Math.cos(a), dy = Math.sin(a); stroke(line(0, -0.32, dx * 0.66, -0.32 + dy * 0.82), i % 2 ? Gn : Bl, 0.05, 0, 0.6); featherEye(dx * 0.62, -0.32 + dy * 0.8, 0.105, a - 1.5708); }
    fill(ell(0, -0.42, 0.2, 0.3), Bl, 1, 0.9); fill(ell(0, -0.48, 0.1, 0.17), Gn, 0, 0.95);
    stroke(line(0, -0.2, 0, 0.1), Bl, 0.1, 1, 0.9); fill(circ(0, 0.14, 0.085), Bl, 1, 0.95);
    fill(poly([[0.05, 0.15], [0.19, 0.1], [0.05, 0.08]]), Y, 1, 1); fill(circ(-0.02, 0.16, 0.022), W, 1, 1);
    for (let i = -1; i <= 1; i++) { stroke(line(0, 0.2, i * 0.07, 0.33), Y, 0.016, 0, 0.9); fill(circ(i * 0.07, 0.34, 0.026), Y, 1, 1); }
    stroke(line(-0.07, -0.7, -0.09, -0.8), Y, 0.03, 1, 0.8); stroke(line(0.07, -0.7, 0.09, -0.8), Y, 0.03, 1, 0.8);
  };
  const feather = (r) => {
    for (let i = 0; i < 16; i++) { const y = -0.95 + i * 0.1, w = 0.2 + 0.3 * Math.sin((i / 16) * 2.6); stroke(line(0, y, w, y + 0.2), i % 2 ? Gn : Bl, 0.035, i % 3 === 0 ? 1 : 0, 0.5); stroke(line(0, y, -w, y + 0.2), i % 2 ? Gn : Bl, 0.035, i % 3 === 0 ? 1 : 0, 0.5); }
    stroke(line(0, -1, 0, 0.3), Y, 0.05, 1, 0.8); featherEye(0, 0.36, 0.44, 0);
  };
  const fish = (r) => {
    const cs = colours(r); frame(r, cs); if (r.chance(0.5)) xf((c) => c.scale(-1, 1)); else xf(() => {});
    const body = (c) => { c.moveTo(0.72, 0); c.quadraticCurveTo(0.2, 0.52, -0.42, 0.07); c.lineTo(-0.78, 0.4); c.lineTo(-0.66, 0); c.lineTo(-0.78, -0.4); c.lineTo(-0.42, -0.07); c.quadraticCurveTo(0.2, -0.52, 0.72, 0); };
    fill(body, cs[0], 0, 0.75);
    fill(poly([[0.1, 0.24], [-0.1, 0.52], [-0.25, 0.2]]), cs[1], 1, 0.85); fill(poly([[0.12, -0.24], [-0.05, -0.46], [-0.2, -0.2]]), cs[1], 1, 0.85);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5 - j; i++) { const x = 0.22 - i * 0.14 - (j % 2) * 0.07, y = (j - 1) * 0.12; stroke((c) => { c.arc(x, y, 0.07, -1.2, 1.2); }, j % 2 ? W : Y, 0.028, 1, 0.9); }
    fill(poly([[0.72, 0], [0.42, 0.2], [0.36, 0], [0.42, -0.2]]), cs[2] === cs[0] ? W : cs[2], 1, 0.9);
    fill(circ(0.47, 0.06, 0.06), W, 1, 1); fill(circ(0.48, 0.06, 0.028), K, 0, 0.8);
    for (let i = -1; i <= 1; i++) stroke(line(-0.5, i * 0.05, -0.74, i * 0.26), W, 0.025, 1, 0.9);
    for (let i = 0; i < 3; i++) fill(circ(0.6 + i * 0.07, 0.42 + i * 0.13, 0.03 + i * 0.012), Bl === cs[0] ? W : Bl, 1, 0.7);
    unxf();
  };
  const eye = (r) => {
    const cs = colours(r); if (r.chance(0.6)) frame(r, cs);
    const iris = r.pick([Bl, Gn, Bl, Y]), lid = r.pick([Bl, R, Gn]);
    const almond = (s) => (c) => { c.moveTo(-0.8 * s, 0); c.quadraticCurveTo(0, 0.72 * s, 0.8 * s, 0); c.quadraticCurveTo(0, -0.56 * s, -0.8 * s, 0); };
    for (let i = 0; i < 9; i++) { const a = 0.5 + (i / 8) * (Math.PI - 1.0); stroke(line(Math.cos(a) * 0.5, Math.sin(a) * 0.3 + 0.05, Math.cos(a) * 0.74, Math.sin(a) * 0.56 + 0.05), lid, 0.035, i % 2, 0.6); }
    fill(almond(1.0), lid, 1, 0.6); fill(almond(0.88), W, 1, 0.8);
    fill(circ(0, 0.03, 0.3), iris, 0, 0.9); stroke(circ(0, 0.03, 0.3), iris === Y ? R : Y, 0.035, 1, 0.95);
    for (let i = 0; i < 12; i++) stroke(line(Math.cos(i * 0.5236) * 0.15, 0.03 + Math.sin(i * 0.5236) * 0.15, Math.cos(i * 0.5236) * 0.26, 0.03 + Math.sin(i * 0.5236) * 0.26), W, 0.014, 0, 1);
    fill(circ(0, 0.03, 0.14), K, 0, 0.7); fill(circ(0.09, 0.12, 0.05), W, 1, 1);
    stroke((c) => { c.moveTo(-0.72, 0.5); c.quadraticCurveTo(0, 0.98, 0.72, 0.5); }, cs[0], 0.07, 1, 0.7);
    for (let i = -1; i <= 1; i++) fill(petal(i * 0.26, -0.5, -1.5708, 0.24, 0.07), cs[1], i ? 0 : 1, 0.7);
  };
  const bird = (r) => {
    const cs = colours(r); frame(r, cs); if (r.chance(0.5)) xf((c) => c.scale(-1, 1)); else xf(() => {});
    fill(poly([[-0.3, 0.02], [-0.76, 0.2], [-0.72, -0.1]]), cs[1], 1, 0.7);
    fill(ell(0, -0.08, 0.44, 0.3, 0.15), cs[0], 0, 0.8);
    for (let i = 0; i < 5; i++) stroke((c) => { c.arc(0.2 - i * 0.02, -0.12, 0.1 + i * 0.045, -1.9, -0.5); }, i % 2 ? W : K, 0.03, i % 2, 0.9);
    fill(petal(0.12, 0.02, 3.0, 0.5, 0.15), cs[2] === cs[0] ? W : cs[2], 1, 0.9);
    fill(circ(0.4, 0.22, 0.15), cs[0], 0, 0.9); stroke((c) => { c.arc(0.4, 0.22, 0.15, 2.2, 4.4); }, W, 0.03, 1, 0.95);
    fill(circ(0.44, 0.26, 0.04), W, 1, 1); fill(circ(0.45, 0.26, 0.018), K, 0, 0.8); fill(poly([[0.53, 0.26], [0.7, 0.2], [0.53, 0.16]]), R, 1, 1);
    stroke(line(-0.05, -0.36, -0.08, -0.62), R, 0.035, 1, 0.8); stroke(line(0.12, -0.36, 0.12, -0.62), R, 0.035, 1, 0.8);
    stroke(line(-0.6, -0.66, 0.6, -0.66), Gn, 0.05, 0, 0.6); for (let i = 0; i < 4; i++) fill(circ(-0.5 + i * 0.34, -0.56, 0.045), i % 2 ? Y : W, 1, 0.8);
    unxf();
  };
  const cypress = (r) => {
    const cs = colours(r); frame(r, cs);
    fill(rect(-0.05, -0.74, 0.05, -0.45), Y, 0, 0.6);
    fill((c) => { c.moveTo(0, 0.8); c.bezierCurveTo(0.14, 0.5, 0.36, -0.1, 0.22, -0.42); c.quadraticCurveTo(0, -0.56, -0.22, -0.42); c.bezierCurveTo(-0.36, -0.1, -0.14, 0.5, 0, 0.8); }, Gn, 0, 0.8);
    for (let i = 0; i < 7; i++) { const y = -0.4 + i * 0.16, w = 0.2 * (1 - i / 8); stroke((c) => { c.moveTo(-w, y); c.lineTo(0, y + 0.1); c.lineTo(w, y); }, i % 2 ? Y : W, 0.03, 1, 0.95); }
    stroke(line(-0.7, -0.74, 0.7, -0.74), cs[0], 0.06, 1, 0.6);
    for (const s of [-1, 1]) { stroke(line(s * 0.52, -0.7, s * 0.52, -0.2), Gn, 0.03, 0, 0.6); for (let i = 0; i < 6; i++) fill(petal(s * 0.52, -0.12, i * 1.047, 0.16, 0.07), cs[1], i % 2, 0.85); fill(circ(s * 0.52, -0.12, 0.05), Y, 1, 1); fill(petal(s * 0.52, -0.5, 1.5708 - s * 0.9, 0.2, 0.06), Gn, 1, 0.7); fill(circ(s * 0.5, 0.42, 0.05), W, 1, 0.8); fill(circ(s * 0.62, 0.62, 0.035), cs[2], 1, 0.8); }
  };
  const sun = (r) => {
    const cs = colours(r); frame(r, cs); const n = r.pick([12, 16, 16, 20, 24]);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, h = TAU / n * 0.52, big = i % 2 === 0; fill(poly([[Math.cos(a - h) * 0.3, Math.sin(a - h) * 0.3], [Math.cos(a) * (big ? 0.8 : 0.62), Math.sin(a) * (big ? 0.8 : 0.62)], [Math.cos(a + h) * 0.3, Math.sin(a + h) * 0.3]]), big ? cs[0] : cs[1], big ? 1 : 0, 0.8); }
    fill(circ(0, 0, 0.33), W, 1, 0.9); fill(circ(0, 0, 0.27), Y, 1, 0.95); fill(circ(0, 0, 0.15), cs[0] === Y ? R : cs[0], 0, 1);
    for (let i = 0; i < 8; i++) fill(circ(Math.cos(i * 0.785) * 0.21, Math.sin(i * 0.785) * 0.21, 0.028), R, 0, 1);
  };
  const fields = [
    () => { for (let j = -2; j < 3; j++) for (let i = -2; i < 3; i++) for (const o of [0, 0.25]) { const x = i * 0.5 + o, y = j * 0.5 + o; fill(poly([[x, y - 0.21], [x + 0.21, y], [x, y + 0.21], [x - 0.21, y]]), o ? ((i + j) & 1 ? Y : W) : ((i + j) & 1 ? R : Gn), 1, 0.8); } },
    () => { for (let j = 4; j >= -4; j--) for (let i = -3; i <= 3; i++) { const x = i * 0.4 + (j & 1) * 0.2, y = j * 0.25 + 0.12; fill((c) => { c.moveTo(x - 0.2, y); c.arc(x, y, 0.2, Math.PI, TAU); c.closePath(); }, K, 0, 0.4); fill((c) => { c.moveTo(x - 0.17, y); c.arc(x, y, 0.17, Math.PI, TAU); c.closePath(); }, [Bl, Gn, Y, R][(j + 8) % 4], 1, 0.85); } },
    () => { for (let j = -3; j < 5; j++) fill(poly([[-1, j * 0.5 - 0.5], [-0.5, j * 0.5], [0, j * 0.5 - 0.5], [0.5, j * 0.5], [1, j * 0.5 - 0.5], [1, j * 0.5 - 0.28], [0.5, j * 0.5 + 0.22], [0, j * 0.5 - 0.28], [-0.5, j * 0.5 + 0.22], [-1, j * 0.5 - 0.28]]), j & 1 ? R : (j >> 1) & 1 ? Y : W, 1, 0.8); },
    () => { for (let j = -2; j < 2; j++) for (let i = -2; i < 2; i++) fill(rect(i * 0.5 + 0.02, j * 0.5 + 0.02, i * 0.5 + 0.48, j * 0.5 + 0.48), (i + j) & 1 ? R : W, 1, 0.8); },
    () => { for (let i = -4; i < 4; i++) fill(poly([[i * 0.5, -1], [i * 0.5 + 0.28, -1], [i * 0.5 + 2.28, 1], [i * 0.5 + 2, 1]]), i & 1 ? Y : Gn, 1, 0.8); },
    // red over white over green: the white band is two white lines with a row of gold diamonds between (a broad white stripe reads as bare metal close to)
    () => { fill(rect(-1, 0.36, 1, 0.98), R, 1, 0.8); fill(rect(-1, 0.2, 1, 0.3), W, 1, 0.8); fill(rect(-1, -0.3, 1, -0.2), W, 1, 0.8); fill(rect(-1, -0.98, 1, -0.36), Gn, 1, 0.8);
      for (let i = -4; i <= 4; i++) fill(poly([[i * 0.25, -0.15], [i * 0.25 + 0.1, 0], [i * 0.25, 0.15], [i * 0.25 - 0.1, 0]]), i & 1 ? Y : Bl, 1, 0.85); },
  ];
  const draw = [];
  for (let i = 0; i < 14; i++) draw.push(flower); draw.push(heartTile, heartTile);
  for (let i = 0; i < 6; i++) draw.push(peacock); draw.push(feather, feather);
  for (let i = 0; i < 8; i++) draw.push(fish); for (let i = 0; i < 8; i++) draw.push(eye);
  for (let i = 0; i < 6; i++) draw.push(bird); for (let i = 0; i < 6; i++) draw.push(cypress);
  for (let i = 0; i < 6; i++) draw.push(sun); for (const f of fields) draw.push(f);
  for (let t = 0; t < 64; t++) { begin(t); draw[t](rng.fork('t' + t)); end(); await ctx.yield(); }
  const texA = new THREE.CanvasTexture(ca); texA.colorSpace = THREE.SRGBColorSpace; texA.flipY = false; texA.anisotropy = 4; texA.minFilter = THREE.LinearMipmapLinearFilter; texA.generateMipmaps = true;
  const texB = new THREE.CanvasTexture(cb); texB.colorSpace = THREE.NoColorSpace; texB.flipY = false; texB.anisotropy = 4; texB.minFilter = THREE.LinearMipmapLinearFilter; texB.generateMipmaps = true;
  return { texA, texB };
}

// ------------------------------------------------------------------------------------------------
// Shaders. One family: JEWEL (enamel + cut tape answering the headlights), with the variants
// TRUCK (instanced, animated), MIRROR (flattened planar reflection drawn additively on the wet deck)
// and ROAD (the wet deck itself). Linear HDR out; Direct3D-safe (no loops, guarded maths).
// ------------------------------------------------------------------------------------------------
const GLSL_BEAM = /* glsl */`
uniform vec3 uEye; uniform vec3 uBeamPos[2]; uniform vec3 uBeamDir; uniform float uBeamGain;
uniform vec4 uBeamLong; uniform vec4 uBeamFlood;
uniform vec3 uSkyFill; uniform vec3 uGlowCol; uniform vec3 uGlowDir;
float beamAt(vec3 P, vec3 bp, out vec3 Ld) {
  vec3 d = P - bp; float r = max(length(d), 1e-3); vec3 dir = d / r; Ld = -dir;
  float c = dot(dir, uBeamDir);
  float lng = smoothstep(uBeamLong.x, uBeamLong.y, c) * (1. - smoothstep(uBeamLong.z, uBeamLong.w, r));
  float fl = smoothstep(uBeamFlood.x, uBeamFlood.y, c) * (1. - smoothstep(uBeamFlood.z * 0.55, uBeamFlood.z, r)) * uBeamFlood.w;
  return max(lng, fl);
}
float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
`;

const JEWEL_VERT = /* glsl */`
attribute vec4 aFx; attribute vec4 aPiv; attribute vec3 aCol;
#ifdef TRUCK
attribute vec4 aTilesA; attribute vec4 aTilesB; attribute vec4 aInst; attribute vec3 aBody;
#endif
uniform float uTime; uniform float uConvoy; uniform float uPix; uniform vec3 uEyeL; uniform vec3 uEyeW; uniform vec2 uFan;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vFx; varying vec3 vL; varying vec3 vBody;
#ifdef MIRROR
varying float vH; varying float vT; varying vec4 vEl; varying float vFw;
  #ifndef TRUCK
attribute vec2 aEl;      // the element's centre height and half height run (makeAcc.elArray)
// the mirrored height h at which a road tilted by c / 2 along the line to the eye shows a point of mirrored height H: (e + h)(h - H) = c D h
float tiltH(float H, float cD, float e) { float b = H + cD - e, r = sqrt(b * b + 4. * e * H); return b > 0. ? .5 * (b + r) : 2. * e * H / (r - b); }
  #endif
#endif
#include <fog_pars_vertex>
void main() {
  vec3 p = position; vec3 n = normal; float tile = aFx.x; float kind = aFx.z; float par = aFx.w; float ph = aPiv.w;
  vBody = vec3(1.);
#ifdef TRUCK
  float iph = aInst.x;
  if (tile > 99.5) { float s = tile - 100.;
    vec4 m0 = step(abs(vec4(s) - vec4(0., 1., 2., 3.)), vec4(.5)); vec4 m1 = step(abs(vec4(s) - vec4(4., 5., 6., 7.)), vec4(.5));
    tile = dot(aTilesA, m0) + dot(aTilesB, m1); }
  vBody = aBody;
  vec3 org = (modelMatrix * instanceMatrix * vec4(0., 2., 0., 1.)).xyz;
  float open = 1. - smoothstep(uFan.y, max(uFan.x, uFan.y + 1.), distance(org, uEyeW));
  if (kind > .5 && kind < 1.5) {
    float a = uConvoy / .64 * (1. - aInst.z) + ph; float c = cos(a), s = sin(a); vec2 r = p.yz - aPiv.yz;
    p.yz = aPiv.yz + vec2(r.x * c - r.y * s, r.x * s + r.y * c); n.yz = vec2(n.y * c - n.z * s, n.y * s + n.z * c);
  } else if (kind > 1.5 && kind < 2.5) {
    float a = -par * mix(.07, 1., open) + sin(uTime * 5. + ph * 9. + iph) * .012; float c = cos(a), s = sin(a); vec2 r = p.xy - aPiv.xy;
    p.xy = aPiv.xy + vec2(r.x * c - r.y * s, r.x * s + r.y * c); n.xy = vec2(n.x * c - n.y * s, n.x * s + n.y * c);
    float b = mix(1.2, .1, open); c = cos(b); s = sin(b); r = p.yz - aPiv.yz;
    p.yz = aPiv.yz + vec2(r.x * c + r.y * s, -r.x * s + r.y * c); n.yz = vec2(n.y * c + n.z * s, -n.y * s + n.z * c);
  } else if (kind > 2.5 && kind < 3.5) {
    float dy = aPiv.y - p.y; p.z += sin(uTime * 3.1 + ph * 6.283 + iph) * par * dy; p.x += cos(uTime * 2.3 + ph * 9. + iph) * par * .4 * dy;
  } else if (kind > 5.5) {
    float f = fract(uTime * (.8 + .5 * ph) + ph * 7. + iph);
    p = aPiv.xyz + ((p - aPiv.xyz) * sin(f * 3.1416) * 1.3 + vec3(par * f * .6, f * (1. - f) * 2.6, -f * 1.9)) * (1. - aInst.z);
  }
  p.y = p.y > 4. ? 4. + (p.y - 4.) * aInst.y : p.y;
  if (kind < .5 || kind > 1.5) {
    float a = (.011 * sin(uTime * 1.9 + iph) + .006 * sin(uTime * 4.3 + iph * 2.)) * (1. - .9 * aInst.z); float c = cos(a), s = sin(a); vec2 r = p.xy - vec2(0., .9);
    p.xy = vec2(0., .9) + vec2(r.x * c - r.y * s, r.x * s + r.y * c);
    p.y += .004 * p.z * sin(uTime * 2.7 + iph * 1.7);
  }
#endif
#ifdef USE_INSTANCING
  vec4 lp = instanceMatrix * vec4(p, 1.); vec3 ln = mat3(instanceMatrix) * n;
#else
  vec4 lp = vec4(p, 1.); vec3 ln = n;
#endif
#ifndef TRUCK
  if (kind > 3.5 && kind < 4.5) {
    vec3 toE = uEyeL - lp.xyz; float dist = length(toE);
    vec3 side = normalize(cross(aPiv.xyz, toE) + vec3(1e-5, 0., 2e-5));
    lp.xyz += side * sign(par) * max(abs(par), dist * uPix);
    ln = normalize(toE + vec3(0., 1e-4, 0.) + side * sign(par) * dist * .6);
  } else if (kind > 4.5 && kind < 5.5) {
    float w = sin(uTime * 6.5 + ph + par * 4.5) + .5 * sin(uTime * 11. + ph * 1.7 + par * 8.);
    lp.xyz += ln * w * .2 * par; lp.y -= par * par * (.12 + .08 * sin(uTime * 2.1 + ph));
  }
#endif
  vL = lp.xyz;
  vec4 wp = modelMatrix * lp; vW = wp.xyz;
#ifdef MIRROR
  vH = lp.y;
  #ifdef TRUCK
  float h = max(lp.y, 0.) * 2.4; vEl = vec4(.5, 1e3, 1e3, 1.); vFw = 1.;
#else
  // the one law of drawing out, for every wet surface and every element whatever it is: the mirror point is the design's (1.4 times the
  // height); the element's own run [Hb, Ht] is laid, by the vertex's place u in it, from where a road tilted .045 away from the eye
  // shows its foot (hb) to where one tilted .045 toward the eye shows its head (ht): about its own mirror point, along the line to the eye.
  // A foot on the road stays on its contact; an element with no run (a flat top) lies at its mirror point
  float ee = max(uEyeL.y, .25), Hb = 1.4 * max(aEl.x - aEl.y, 0.), Ht = max(1.4 * (aEl.x + aEl.y), Hb), run = Ht - Hb;
  float cD = .09 * distance(lp.xz, uEyeL.xz) * step(1e-3, run);
  float hb = tiltH(Hb, -cD, ee), ht = tiltH(Ht, cD, ee), eu = run > 1e-3 ? clamp((1.4 * max(lp.y, 0.) - Hb) / run, 0., 1.) : .5;
  float sb = Hb - hb, st = ht - Ht, eL = ht - hb, eS = sb + st;
  // 6e, an element laid by columns (the hangers' pennants, aPiv.x): its columns differ in height (the whole height at the hoist, none at
  // the tip), and laid whole by u it is a stretched picture of itself, a flag lying on the road. A wet road smears, it does not stretch:
  // each column is its own run B (1 - par) about the element's mirror point and is drawn out by the same two streaks, so it covers
  // the share k = (its run + S) / L of the laid length. With no streak that is the flat copy; with a long one every column lies nearly
  // the whole length and the pennant is a stripe that dims toward its tip
  float runC = run, k = 1., eup = eu;
  if (kind > 4.5 && kind < 5.5 && aPiv.x > .5) { runC = run * (1. - par); k = (runC + eS) / max(eL, 1e-4); eu = .5 + .5 * aPiv.y; eup = .5 + (eu - .5) * k; }
  float h = mix(hb, ht, eup);
  // its light is spread over the drawn-out length L: each end fades over that end's own streak, and a streak longer than the element
  // (or the column) is dimmer in all (4 B S / L^2): the light over the length is the flat copy's, the peak never over the source
  vEl = vec4(eu, sb > 1e-4 ? k * eL / (2. * sb) : 1e3, st > 1e-4 ? k * eL / (2. * st) : 1e3, eS > runC ? 4. * runC * eS / ((runC + eS) * (runC + eS)) : 1.);
  // dimmed once (6c): the fall-off by t is laid on an element by the share of it that is not drawn out, 1 - S / B: whole on a flat copy, none
  // once the streak is as long as the element's own run (from there the spread above is the dimming), fading between, so nothing jumps
  vFw = run > 1e-3 ? clamp(1. - eS / max(runC, 1e-4), 0., 1.) : 1.;
#endif
  float t = uEyeL.y / max(uEyeL.y + h, 1e-3);
  vT = t;
  vec3 q = vec3(mix(uEyeL.x, lp.x, t), .04, mix(uEyeL.z, lp.z, t));
  q.x += sin(q.z * 1.7 + uTime * 1.9) * .012 * h;
  if (uEyeL.y < .25) q = vec3(0., -2000., 0.);
  vL = q; wp = modelMatrix * vec4(q, 1.);
#endif
  vN = normalize(mat3(modelMatrix) * ln + vec3(0., 1e-6, 0.));
  vCol = aCol; vUv = uv; vFx = vec4(tile, aFx.y, kind, par);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the mirrors' level, one number for every wet surface and every copy (the trucks' and the portal's streak too). 6c counted that with the
// break terms free (they peak at 1.95) no level over live's .5 keeps every mirrored pixel under the thing it mirrors. 6d: the level is 1
// (wet tarmac at a grazing angle gives the light back nearly whole) and the law itself holds the bound: after the breaks a copy is
// never brighter than the lit thing it mirrors (the min in JEWEL_FRAG); the fall-offs then only dim it
const MIRROR_LEVEL = '1.';

const JEWEL_FRAG = /* glsl */`
uniform sampler2D tA; uniform sampler2D tB; uniform float uTime; uniform float uTapeGain; uniform float uArch; uniform vec3 uEyeL; uniform float uMirrorK;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vFx; varying vec3 vL; varying vec3 vBody;
#ifdef MIRROR
varying float vH; varying float vT; varying vec4 vEl; varying float vFw; uniform float uSnowK;
#endif
${GLSL_BEAM}
#include <fog_pars_fragment>
void main() {
#ifdef MIRROR
#ifndef OPEN
  bool offDeck = abs(vL.x) > 5.62 || abs(vL.z) > 218.;      // off the deck: decided here, cut below, after the last derivative of a mirror (a derivative taken after a discard is not defined)
#endif
#endif
  vec3 Ng = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 V = normalize(uEye - vW + vec3(0., 1e-5, 0.));
#ifndef MIRROR
  if (dot(Ng, V) < 0.) Ng = -Ng;
#endif
  vec3 N = Ng;
  float tile = vFx.x; vec3 base = vCol; float tape = 0.; float hgt = .5;
  vec2 uv = vUv;
#ifdef MIRROR
  // wet tarmac draws a reflection out along the line of sight: beyond a few metres every column of the picture slips
  // by its own amount, so a mirrored pattern smears into streaks of its colours and is never a second copy of the thing
  vec2 dm = vL.xz - uEyeL.xz; float dml = length(dm); float mang = atan(dm.x, abs(dm.y) + 1e-3);
  float stk = vnoise(vec2(mang * 70., dml * .1 + 3.));
  float colv = vnoise(vec2(mang * 113., 7.)), sk = smoothstep(1., 5., dml);
  uv += (vec2(stk, colv) - .5) * vec2(.12, .9) * sk;
  uv.y = mix(uv.y, floor(uv.y) + .15 + .7 * colv, .88 * sk);      // along its length a streak holds one band of the pattern's colours
#endif
  // what a mirror needs from the pixels beside this one is taken here, on every pixel, inside no branch and above the mirror's cut: the width of the
  // tesserae's grid (uv is not written again below) and the atlas's gradient (the other materials take the emboss's derivatives further down, above their own cut)
  vec2 q = vec2(uv.x + uv.y, uv.x - uv.y) * 15.; vec2 fw = fwidth(q);
  vec2 gx = dFdx(vUv) * vec2(.125, -.125), gy = dFdy(vUv) * vec2(.125, -.125);
#ifdef MIRROR
  #ifndef OPEN
  if (offDeck) discard;      // a mirror takes no derivative below this line: a copy's pixel off the deck leaves here, before the atlas is read
  #endif
#endif
#ifdef CUTOUT
  bool cut = false;      // the two cuts below are decided where they stand and made after the last derivative (the emboss): the pixels beside a cut read its height
#endif
  if (tile > -.5) {
    float t = floor(tile + .5); vec2 cell = vec2(mod(t, 8.), floor(t / 8.));
    vec2 f = mix(fract(uv), uv, step(abs(uv - .5), vec2(.5))); f = clamp(f, .012, .988);
    vec2 auv = (cell + vec2(f.x, 1. - f.y)) / 8.;
#ifdef MIRROR
    gx *= 6.; gy *= 6.;      // a mirrored pattern is read blurred: bands of its colours, never a second copy of the motif
#endif
    vec3 c = textureGrad(tA, auv, gx, gy).rgb; vec4 d = textureGrad(tB, auv, gx, gy);
    base = c * vCol; tape = smoothstep(.3, .7, d.r); hgt = d.g;
#ifdef CUTOUT
    // motifs painted straight on rock: the tile's black ground is cut away; kind 7 is an eye whose lid follows the eye's distance
    bool lidded = false;
    if (vFx.z > 6.5) {
      vec2 ac = abs(uv - .5);
      if (max(ac.x, ac.y) > .405 || ac.x + ac.y > .66) cut = true;      // an eye on a boulder carries no square frame
      float dE = distance(uEye, vW); float ph = fract(uTime * .09 + vFx.w);
      float cl = max(1. - smoothstep(6., 15., dE), smoothstep(95., 135., dE));
      cl = max(cl, smoothstep(.93, .955, ph) * (1. - smoothstep(.965, .99, ph)));
      // the lid comes down inside the almond only, so a closed eye is a sleeping eye: lid, gold lash line, brow and lashes
      float ax = (uv.x - .5) / .4; float arc = max(1. - ax * ax, 0.);
      float yT = .5 + .18 * arc, yB = .5 - .14 * arc, lidY = max(mix(.7, .3, cl), yB);
      if (abs(ax) < 1. && uv.y < yT && uv.y > lidY) {
        vec3 lidC = textureLod(tA, (cell + vec2(.5, .331)) / 8., 0.).rgb;
        float kl = uv.y - lidY;
        base = (lidC * .5 + .012) * vCol; tape = 0.; hgt = .6 + .3 * arc * smoothstep(0., .12, kl);
        if (kl < .03) { base = vec3(1., .55, .05); tape = 1.; hgt = .9; }
        lidded = true;
      }
    }
    if (d.g < .3 && !lidded) cut = true;
#endif
  } else if (tile > -1.5) { base = vCol; }
  else if (tile > -2.5) { base = vCol; tape = 1.; hgt = .8; }
  else if (tile > -3.5) { base = vec3(.018, .018, .022) * vCol; }
  else { base = vBody * vCol; }
  // tesserae: a diamond grid in tile space; the grout and the glitter fade out as cells shrink below a pixel
  vec2 id = floor(q); vec2 fq = fract(q);
  float aa = clamp(1. - max(fw.x, fw.y) * 1.4, 0., 1.);
#ifdef MIRROR
  #ifdef CUTOUT
  if (cut) discard;      // (a mirror with the cut-out, which no material here makes: its cuts are made here, a mirror takes no derivative below)
  #endif
#endif
  float h1 = hash21(id), h2 = hash21(id + 17.31), h3 = hash21(id + 43.7);
  float grout = smoothstep(0., .1, min(min(fq.x, 1. - fq.x), min(fq.y, 1. - fq.y)));
  float groutF = mix(.84, grout, aa);
  float grime = .72 + .28 * vnoise(uv * 3.3 + vL.yz * .37);
#ifndef MIRROR
  // emboss: hammered relief from the height channel plus dimples
  float H = hgt + .22 * vnoise(uv * 19.) * (1. - tape) + tape * (h1 - .5) * .25 * aa;
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float dhx = dFdx(H), dhy = dFdy(H);
#ifdef CUTOUT
  if (cut) discard;      // the last derivative is taken: the cuts are made here, before the light is worked out
#endif
  vec3 r1 = cross(dpy, Ng), r2 = cross(Ng, dpx); float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  N = normalize(abs(det) * Ng - .045 * grad + Ng * 1e-7);
#endif
  vec3 L0, L1; float b0 = beamAt(vW, uBeamPos[0], L0), b1 = beamAt(vW, uBeamPos[1], L1);
  float gate = 1.;
  if (vFx.y > .001) { float thr = vFx.y + (h2 - .5) * .1; gate = smoothstep(thr - .015, thr + .015, uArch * 1.12); }
  b0 *= uBeamGain * gate; b1 *= uBeamGain * gate;
  float bsum = .5 * (b0 + b1);
  float lam = .5 * (b0 * max(dot(N, L0), 0.) + b1 * max(dot(N, L1), 0.));
  float spec = .5 * (b0 * pow(max(dot(N, normalize(L0 + V)), 0.), 60.) + b1 * pow(max(dot(N, normalize(L1 + V)), 0.), 60.));
  vec3 paint = (base * grime * (1.05 * lam + .14 * bsum) + vec3(.8, .88, 1.) * spec * .3 * (.3 + base)) * mix(1., .5, smoothstep(150., 430., distance(uEye, vW)));
  float wid = 1. + 8. * h1;
  float lobe = .5 * (b0 * exp(-(1. - dot(V, L0)) * 240. / wid) + b1 * exp(-(1. - dot(V, L1)) * 240. / wid));
  float ent = smoothstep(.02, .4, abs(dot(Ng, V)));
  vec3 hv = normalize(vec3(h1, h2, h3) - .5 + vec3(0., 0., 1e-3));
  float glit = smoothstep(.8, 1., abs(dot(hv, normalize(V + N * .35)))) * aa;
  vec3 tcol = base * (.82 + .18 * grime) + vec3(.035);
  // tape within arm's length keeps its colour instead of clipping to white
  vec3 tapeC = tcol * uTapeGain * (lobe * (.75 + 1.7 * glit) + bsum * (.16 + .5 * glit)) * ent * groutF * mix(.55, 1., smoothstep(2., 10., distance(uEye, vW))) * mix(1., .6, smoothstep(30., 90., distance(uEye, vW)))
    * mix(1., mix(1., .4, smoothstep(150., 400., distance(uEye, vW))), step(3.5, vFx.z) * step(vFx.z, 4.5));      // far hangers (ribbons) are held down so they do not wash the convoy out from the air
  vec3 lit = mix(paint, tapeC, tape);
  vec3 fill = uSkyFill * (.5 + .5 * N.y) * (.5 + .5 * grime);
  float rim = 1. - abs(dot(N, V)); rim *= rim * rim;
  fill += uGlowCol * (.22 * rim + .3 * pow(max(dot(N, uGlowDir), 0.), 2.)) * (.6 + .4 * tape);
  vec3 col = lit + fill;
#ifdef MIRROR
  vec3 Vl = normalize(uEyeL - vL + vec3(0., 1e-4, 0.));
  float fres = mix(.3, 1., pow(1. - clamp(Vl.y, 0., 1.), 2.));
  // the breaks along a streak are the road's own (6b): its wet patches and tyre tracks (ROAD_FRAG's own field, at this place of the road:
  // on the deck the very patches; on the curved road the same field in world metres, tracks left out) and its ripple (the road's ripple
  // scale and drift, as noise: no period). They are fixed to the road and slide with it; live's constants are kept
  vec2 pr = vL.xz; float rn2 = vnoise(pr * vec2(1.3, .4)), wetM = smoothstep(.25, .7, vnoise(pr * vec2(.35, .09) + 3.) * .7 + rn2 * .3);
  #ifndef OPEN
  { float tw = mix(5., 14., uSnowK), t1 = abs(pr.x - 3.6) - 1.05, t2 = abs(pr.x + 2.4) - 1.05; wetM = clamp(wetM + (exp(-t1 * t1 * tw) + exp(-t2 * t2 * tw)) * .45, 0., 1.); }
  #endif
  float rr = vnoise(pr * vec2(2.3, 1.1) + vec2(.55, -.48) * uTime), rough = 1. - rn2;
  col = max(lit, 0.) * ${MIRROR_LEVEL} * fres * (.62 + .38 * (2. * rr - 1.)) * uMirrorK;
  col *= wetM * 1.5 * (.4 + .9 * rr);
  col = min(col, max(lit, 0.));                      // 6d: a mirror gives back at most the light of what it mirrors
  #ifdef TRUCK
  // 6g: a truck's flank is one flat copy; broken only by the road's patches (a metre and more wide) it lay as a hard-edged pane (6b to 6e).
  // The trucks keep live's own columns: by the angle from the eye, the line along which a wet road draws a reflection out (upright in
  // the picture), whole columns drop out and every column ends at its own length: ragged streaks. (6f had columns along the lane,
  // which hatched the copies beside the eye aslant.) The brightening factor is capped at 1, so the bound above holds
  col *= smoothstep(.2, .7, stk) * min(1., 1.5 * (.4 + .9 * vnoise(vec2(mang * 190., 3.))));
  col *= 1. - smoothstep(.5, 1., vH / mix(1., 10., colv * colv));
  col *= 1. - smoothstep(5.2, 5.62, abs(vL.x));
  col *= mix(1., .4, smoothstep(2.2, 7., vH));      // the trucks' copies keep their own flat shape and these fall-offs; the level, the breaks and the bound above are every copy's
  #else
  // the one fall-off of every wet surface (gorge road, bazaar, deck): a streak is drawn out from under its source over the share
  // 1 - t of the way to the eye and is that much dimmer: t ^ c, c the column's own roughness (a smooth column mirrors whole, the
  // roughest falls by t), so the streaks end ragged. Since 6b the roughness is the road's own patch noise, not a column's.
  // No height and no distance is typed: what stands higher mirrors further out toward the eye, longer and so fainter
  col *= pow(clamp(vT, 1e-4, 1.), rough * vFw);
  // the element's light spread over its drawn-out length (see JEWEL_VERT)
  col *= vEl.w * min(1., min(vEl.x * vEl.y, (1. - vEl.x) * vEl.z));
    #ifndef OPEN
  col *= 1. - smoothstep(5.2, 5.62, abs(vL.x));
    #endif
  #endif
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(max(col, 0.), 1.);
#else
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
#endif
}`;

const ROAD_VERT = /* glsl */`
varying vec3 vW; varying vec3 vL;
#include <fog_pars_vertex>
void main() {
#ifdef ROADUV
  vL = vec3(uv.x, 0., uv.y);
#else
  vL = position;
#endif
  vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROAD_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uSkyTop; uniform vec3 uSkyLow; uniform mat3 uNrm; uniform float uWetK; uniform float uSnowK; uniform float uDryK;
uniform vec4 uPortalPos; uniform vec3 uPortalN; uniform vec3 uPortalCol; uniform float uMirrorK;
varying vec3 vW; varying vec3 vL;
${GLSL_BEAM}
#include <fog_pars_fragment>
void main() {
  vec3 V = normalize(uEye - vW + vec3(0., 1e-5, 0.));
  vec2 p = vL.xz; float dist = length(uEye - vW);
  float wn2 = vnoise(p * vec2(1.3, .4));
  float wet = smoothstep(.25, .7, vnoise(p * vec2(.35, .09) + 3.) * .7 + wn2 * .3);
  float tw = mix(5., 14., uSnowK); float t1 = abs(p.x - 3.6) - 1.05, t2 = abs(p.x + 2.4) - 1.05;
  float tracks = exp(-t1 * t1 * tw) + exp(-t2 * t2 * tw);
  float wetP = clamp(wet + tracks * .45, 0., 1.);      // the patches and tracks themselves, for the mirrors' breaks
  wet = wetP * uWetK * (1. - .8 * uSnowK);
  float snw = uSnowK * clamp(.4 + .9 * vnoise(p * vec2(.9, .35) + 11.) - tracks * .42, 0., 1.);      // snow lies between the ruts; the ruts show dark wet road
  float fade = clamp(1. - dist / 90., 0., 1.);
  vec2 rp = p * vec2(2.3, 1.1);
  vec3 nl = vec3(0., 1., 0.);
  nl.x += (sin(rp.x * 3.1 + uTime * 1.7 + sin(rp.y * 1.3 + uTime) * 2.) * .03 + (vnoise(p * 9.) - .5) * .09 * (1. - wet)) * fade;
  nl.z += (sin(rp.y * 2.7 - uTime * 1.3 + sin(rp.x * 1.9) * 2.) * .02 + (vnoise(p * 9. + 31.) - .5) * .09 * (1. - wet)) * fade;
  // wind-packed drifts: fine relief in the snow
  nl.x += (vnoise(p * 6.) - .5) * .12 * snw * fade; nl.z += (vnoise(p * 6. + 17.) - .5) * .12 * snw * fade;
  vec3 N = normalize(uNrm * nl);
  vec3 L0, L1; float b0 = beamAt(vW, uBeamPos[0], L0) * uBeamGain, b1 = beamAt(vW, uBeamPos[1], L1) * uBeamGain;
  float lam = .5 * (b0 * max(dot(N, L0), 0.) + b1 * max(dot(N, L1), 0.));
  float agg = vnoise(p * 23.) * vnoise(p * 61. + 7.);
  vec3 alb = vec3(.05, .052, .06) * (.8 + .4 * vnoise(p * 2.7)) * mix(1., .7, wet);
  // a dry night: pale dust on the road, warmer and lighter, and it mirrors nothing
  alb = mix(alb, vec3(.09, .08, .07) * (.7 + .6 * vnoise(p * 2.7)) * (.75 + .5 * agg), uDryK);
  // the warm pool our own lamps lay on the road: the unlit road stays darker than the lit ellipse
  vec3 col = alb * vec3(1., .9, .72) * (lam * 5. + (.04 + .05 * uDryK) * (b0 + b1));
  // snow scatters the beam back even at a grazing angle: warm white near the cab, falling to the sky's blue beyond 40 m
  float lamS = .5 * (b0 * sqrt(max(dot(N, L0), 0.)) + b1 * sqrt(max(dot(N, L1), 0.))) * mix(1., .4, smoothstep(12., 55., dist));
  vec3 snowAlb = vec3(.62, .64, .7) * (.8 + .2 * agg) * (.82 + .36 * vnoise(p * vec2(1.9, .7) + 5.));
  vec3 snowC = snowAlb * (vec3(1., .92, .78) * lamS * 1.7 + (uSkyLow * .55 + uSkyTop * .45) * 1.1 + uGlowCol * .25 * max(dot(N, uGlowDir) + .4, 0.));
  col = mix(col, snowC, snw);
  // wet grit throws back a little of the beam as fine glitter
  vec2 gid = floor(p * 14.); float gh = hash21(gid);
  float gl = step(.975, gh) * smoothstep(.75, 1., abs(dot(normalize(vec3(hash21(gid + 3.1), .6, hash21(gid + 9.7)) - vec3(.5, 0., .5)), V)));
  col += vec3(.9, .95, 1.) * gl * (b0 + b1) * .5 * fade * .3 * (.3 + agg);
  // each flake a spark: snow glitter that shifts with the angle of view
  vec2 gid2 = floor(p * 22.); float gh2 = hash21(gid2 + 5.3);
  float gl2 = step(.9, gh2) * smoothstep(.8, 1., abs(dot(normalize(vec3(hash21(gid2 + 1.7), .5, hash21(gid2 + 6.1)) - vec3(.5, 0., .5)), V)));
  col += vec3(1., .97, .9) * gl2 * 3. * snw * (b0 + b1) * .5 * fade;
  // the road mirror: sky fill and the afterglow, by fresnel
  vec3 R = reflect(-V, N); float f = .03 + .97 * pow(1. - clamp(dot(N, V), 0., 1.), 5.);
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(0., .6, abs(R.y))) + uGlowCol * (pow(max(dot(R, uGlowDir), 0.), 8.) * 1.2 + pow(max(dot(R, uGlowDir), 0.), 2.) * .5);
  col += sky * f * (.2 + .8 * wet) * (1. - uDryK) * (1. - .85 * snw);
  col += uSkyFill * .1;
  // the portal's own streak. The mirrored eye's ray is carried to the portal's plane, which it meets at the mirrored height hy (the
  // share 1 / s of the way). 6c: the road's ripple is laid as what it is, the tilt of the law of drawing out: each road point is tilted
  // by its own ripple, c = .09 (2 r - 1) (.09 = 2 x .045, the road's largest tilt; r the ripple noise at the road's scale and drift), and
  // shows the point of the portal that tilt gives, (e + h)(h - H) = c D h. The streak is on where that point (H / 1.4 over the deck:
  // the design's 1.4) lies in the disc, so the tongue is whole where every tilt sees the disc and breaks up toward the eye, where only
  // the steeper ripples still reach it. Its light: the level, the copies' fresnel and fall-off, the road's own wet patches and tracks;
  // largest factor = the level. Nothing where the look has no mirror
  float pa = dot(uEye.xz - uPortalPos.xz, uPortalN.xz), pb = dot(vW.xz - uPortalPos.xz, uPortalN.xz), eh = uEye.y - vW.y;
  if (uMirrorK * (uPortalCol.r + uPortalCol.g + uPortalCol.b) > 0. && pb > 0. && pa > pb + .5 && eh > .25) {
    float ps = pa / (pa - pb), hy = eh * (ps - 1.);
    vec2 hit = uEye.xz + ps * (vW.xz - uEye.xz);
    float rr = vnoise(rp + vec2(.55, -.48) * uTime);
    // 6d: a pixel of wet road holds every ripple tilt at once, so the streak's strength there is the SHARE of the tilts c in
    // [-.09, .09] whose mirrored point (hy (1 - c k), k = D / (e + h)) lies in the disc; 6c took the one tilt of the ripple noise
    // (a sheet with a cut edge). Whole where every tilt sees the disc, thinning toward the eye and toward the disc's sides; the
    // ripple only stirs it (.8 to 1)
    float dx = length(hit - uPortalPos.xz), cy = uPortalPos.y - vW.y;
    if (dx < uPortalPos.w && hy > 0.) {
      float sx = sqrt(uPortalPos.w * uPortalPos.w - dx * dx), kk = max(length(hit - uEye.xz) / (eh + hy), 1e-4);
      float c0 = (1. - 1.4 * (cy + sx) / hy) / kk, c1 = (1. - 1.4 * max(cy - sx, 0.) / hy) / kk;
      float pm = clamp((min(c1, .09) - max(c0, -.09)) / .18, 0., 1.);
      if (pm > 0.) {
        float fr = mix(.3, 1., pow(1. - clamp(V.y, 0., 1.), 2.));
        col += uPortalCol * (pm * ${MIRROR_LEVEL} * fr * uMirrorK * wetP * (.8 + .2 * rr) * pow(clamp(1. / ps, 1e-4, 1.), 1. - wn2));
      }
    }
  }
  gl_FragColor = vec4(max(col, 0.), 1.);
  #include <fog_fragment>
}`;

function makeMaterials(U, tex, world) {
  const fogU = THREE.UniformsLib.fog;
  const mk = (defines, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(fogU), ...U, tA: { value: tex.texA }, tB: { value: tex.texB } },
    vertexShader: JEWEL_VERT, fragmentShader: JEWEL_FRAG, defines, fog: true, side: THREE.DoubleSide, ...extra });
  const mirrorOpts = { side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const mats = {
    jewel: mk({}), truck: mk({ TRUCK: 1 }),
    truckMirror: mk({ TRUCK: 1, MIRROR: 1 }, mirrorOpts), mirror: mk({ MIRROR: 1 }, mirrorOpts),
    road: new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(fogU), ...U }, vertexShader: ROAD_VERT, fragmentShader: ROAD_FRAG, fog: true }),
    // for the world around the bridge (opts.world): mirrors on any wet road, motifs painted on rock, a road ribbon in path space
    ...(world ? { mirrorOpen: mk({ MIRROR: 1, OPEN: 1 }, mirrorOpts), cutout: mk({ CUTOUT: 1 }),
      roadPath: new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(fogU), ...U }, vertexShader: ROAD_VERT, fragmentShader: ROAD_FRAG, fog: true, defines: { ROADUV: 1 } }) } : {}),
  };
  // the gorge road's mirror: the same program and, since round 6, the same law as mirrorOpen (its uMirFade is no longer read)
  if (world) { mats.mirrorGorge = mk({ MIRROR: 1, OPEN: 1 }, mirrorOpts); mats.mirrorGorge.uniforms.uMirFade = { value: 1 }; }
  return mats;
}

// ------------------------------------------------------------------------------------------------
// The jingle truck: 9 m long, 3 m wide, 4 m to the top of the load and a 3 m carved crown leaning
// out over the cab. Local frame: +Z is the direction of travel, origin on the road under its centre.
// Tile slots (per instance): 0, 1 flank panels; 2 door eye; 3 crown front; 4 crown top band and cheeks;
// 5 tailgate; 6 border field; 7 bonnet and crown back.
// ------------------------------------------------------------------------------------------------
function* buildTruck(G, rng, pal) {      // a generator: each yield is a place the build may hand the page back
  const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const RED = C(pal[2]), GRN = C(pal[3]), GLD = C(pal[4]), BLU = C(pal[5]), WHT = C(pal[6], 0.9);
  const jew = [RED, GLD, GRN, BLU, WHT];
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  const side = (s, x, z0, z1, y0, y1, r) => { if (s > 0) G.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], r); else G.quad([-x, y0, z0], [-x, y0, z1], [-x, y1, z1], [-x, y1, z0], r); };
  const sidePanel = (s, x, z0, z1, y0, y1, d, bev) => { if (s > 0) G.panel([x, y0, z1], [0, 0, -1], [0, 1, 0], [1, 0, 0], z1 - z0, y1 - y0, d, bev); else G.panel([-x, y0, z0], [0, 0, 1], [0, 1, 0], [-1, 0, 0], z1 - z0, y1 - y0, d, bev); };
  const dirt = (k) => [k, k * 0.97, k * 0.92];

  // chassis, axles, fuel tank
  S({ tile: -3 }); G.box(0, 0.95, -0.1, 1.7, 0.4, 8.6);
  for (const z of [3.05, -1.75, -3.15]) G.box(0, 0.64, z, 2.4, 0.22, 0.22, 'xXYzZ');
  S({ tile: 100 + 7, tint: dirt(0.7) }); G.box(1.22, 1.02, 0.55, 0.5, 0.5, 1.5); S({ tile: 100 + 6, tint: dirt(0.8) }); side(1, 1.48, -0.2, 1.3, 0.8, 1.26, [0, 0.27, 3, 0.73]);
  // wheels: lathe about the axle, pinwheel hub caps so the turning reads
  for (const z of [3.05, -1.75, -3.15]) for (const s of [-1, 1]) {
    const cx = s * 1.2, cy = 0.64, R0 = 0.64, R1 = 0.37, W2 = 0.27, n = 10, ph = rng() * TAU;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      const P = (a, r, x) => [cx + x * s, cy + Math.cos(a) * r, z + Math.sin(a) * r];
      const Nn = (a, nx, nr) => [nx * s, Math.cos(a) * nr, Math.sin(a) * nr];
      const q = (A, B, Cc, D, nA, nB, nC, nD) => { if (s > 0) G.quadN(A, B, Cc, D, nA, nB, nC, nD); else G.quadN(B, A, D, Cc, nB, nA, nD, nC); };
      S({ tile: -3, kind: 1, pivot: [cx, cy, z, ph], tint: [1.6, 1.6, 1.7] });
      q(P(a1, R0, -W2), P(a0, R0, -W2), P(a0, R0, W2), P(a1, R0, W2), Nn(a1, 0, 1), Nn(a0, 0, 1), Nn(a0, 0, 1), Nn(a1, 0, 1));
      q(P(a1, R1, W2 + 0.03), P(a1, R0, W2), P(a0, R0, W2), P(a0, R1, W2 + 0.03), Nn(a1, 0.9, 0.4), Nn(a1, 0.7, 0.7), Nn(a0, 0.7, 0.7), Nn(a0, 0.9, 0.4));
      S({ tile: i % 2 ? -2 : -4, kind: 1, pivot: [cx, cy, z, ph], tint: i % 2 ? WHT : [0.9, 0.9, 0.9] });
      const hub = [cx + (W2 + 0.1) * s, cy, z];
      if (s > 0) G.tri(P(a1, R1, W2 + 0.03), P(a0, R1, W2 + 0.03), hub, [0, 0], [0.3, 0], [0.15, 0.3]); else G.tri(P(a0, R1, W2 + 0.03), P(a1, R1, W2 + 0.03), hub, [0, 0], [0.3, 0], [0.15, 0.3]);
    }
  }
  yield;
  // mudguards with tape lips
  for (const s of [-1, 1]) for (const [z, len] of [[3.05, 1.9], [-2.45, 3.3]]) {
    S({ tile: T.checks, tint: dirt(0.75) }); G.box(s * 1.3, 1.42, z, 0.58, 0.08, len, 'xXYzZy', [0, 0, 1, len * 1.7]);
    S({ tile: -2, tint: s > 0 ? RED : RED }); side(s, 1.6, z - len / 2, z + len / 2, 1.3, 1.46, [0, 0, len * 0.5, 0.08]);
  }
  // front bumper, chevron field, and the chain fringe with hearts and bells that ignites first
  S({ tile: 100 + 6, tint: dirt(0.85) }); G.box(0, 0.98, 4.56, 3.2, 0.36, 0.16, 'Z', [0, 0.25, 5, 0.75]);
  S({ tile: -3 }); G.box(0, 0.98, 4.5, 3.2, 0.36, 0.14, 'xXYy');
  const chain = (x, y, z, len, nx, nz, colr, amp) => {
    const ph = rng(), px = -nz * 0.035, pz = nx * 0.035;
    S({ tile: -2, kind: 3, param: amp, pivot: [x, y, z, ph], tint: WHT });
    G.quad([x - px, y - len, z - pz], [x + px, y - len, z + pz], [x + px, y, z + pz], [x - px, y, z - pz], [0, 0, 0.04, len * 0.5]);
    S({ tile: -2, kind: 3, param: amp, pivot: [x, y, z, ph], tint: colr });
    const w = 0.11, hy = y - len - 0.1; G.quad([x, hy - 0.14, z], [x + nz * -w, hy, z + nx * w], [x, hy + 0.14, z], [x - nz * -w, hy, z - nx * w], [0, 0, 0.12, 0.12]);
  };
  for (let i = 0; i < 15; i++) chain(-1.5 + i * 0.214, 0.8, 4.64, 0.2 + (i % 2) * 0.1, 0, 1, jew[i % 2 ? 0 : (i % 4 ? 1 : 4)], 0.35);
  yield;
  // bonnet: tapered nose with chamfered shoulders; grille field and two blind lamp reflectors
  { const sec = (z, k) => [[-1.18 * k, 1.15], [-1.18 * k, 1.95], [-0.86 * k, 2.3 - (1 - k) * 0.5], [0.86 * k, 2.3 - (1 - k) * 0.5], [1.18 * k, 1.95], [1.18 * k, 1.15]].map((p) => [p[0], p[1], z]);
    const a = sec(3.3, 1), b = sec(4.42, 0.9);
    const tiles = [100 + 1, 100 + 6, 100 + 7, 100 + 6, 100 + 1], rs = [[0, 0, 1, 1], [0, 0.3, 2, 0.7], [0, 0, 1, 1], [0, 0.3, 2, 0.7], [0, 0, 1, 1]];
    for (let i = 0; i < 5; i++) { S({ tile: tiles[i], tint: dirt(0.9) }); G.quad(b[i], a[i], a[i + 1], b[i + 1], rs[i]); }
    S({ tile: 100 + 6, tint: dirt(0.8) }); G.quad(b[0], b[5], b[4], b[1], [0, 0, 2, 1]); G.quad(b[1], b[4], b[3], b[2], [0, 0, 2, 0.4]);
    for (const s of [-1, 1]) { S({ tile: -2, tint: [0.8, 0.82, 0.78] }); for (let i = 0; i < 8; i++) { const a0 = i * 0.785, a1 = a0 + 0.785; G.tri([s * 0.78 + Math.cos(a0) * 0.2, 1.62 + Math.sin(a0) * 0.2, 4.46], [s * 0.78 + Math.cos(a1) * 0.2, 1.62 + Math.sin(a1) * 0.2, 4.46], [s * 0.78, 1.62, 4.52], [0, 0], [0.1, 0], [0.05, 0.1]); } }
  }
  yield;
  // cab: doors with the painted eye, dark glass, a row of tassels behind the windscreen
  S({ tile: 100 + 6, tint: dirt(0.85) }); G.box(0, 2.25, 2.4, 3.0, 2.2, 1.8, 'xX', [0, 0, 3, 3.6]);      // the cab's sides carry the truck's border field: no bare enamel round the door
  S({ tile: 100 + 6, tint: dirt(0.85) }); G.box(0, 2.25, 2.4, 3.0, 2.2, 1.8, 'Z', [0, 0, 3, 1.2]);      // the cab front carries the border field too
  G.box(0, 2.25, 2.4, 3.0, 2.2, 1.8, 'Y', [0, 0, 3, 1.8]);
  S({ tile: 100 + 7, tint: dirt(0.95) }); G.quad([-0.55, 3.365, 2.95], [0.55, 3.365, 2.95], [0.55, 3.365, 1.85], [-0.55, 3.365, 1.85]);      // a medallion on the cab roof
  for (const s of [-1, 1]) {
    S({ tile: 100 + 2, tint: dirt(0.95) }); sidePanel(s, 1.5, 1.62, 3.18, 1.22, 2.42, 0.05, 0.04);
    S({ tile: -3, tint: [0.7, 0.9, 1.6] }); side(s, 1.515, 1.7, 3.1, 2.52, 3.2);
    S({ tile: -2, tint: GLD }); side(s, 1.52, 1.62, 3.18, 2.44, 2.5, [0, 0, 0.8, 0.03]); side(s, 1.52, 1.62, 3.18, 3.22, 3.3, [0, 0, 0.8, 0.03]);
    // the door window is dressed: a scalloped visor, a medallion low in the pane and a row of tape hearts swinging on the glass
    S({ tile: T.scallops, tint: dirt(0.95) }); side(s, 1.522, 1.7, 3.1, 2.98, 3.2, [0, 0.38, 2.5, 0.62]);
    S({ tile: 100 + 7, tint: dirt(0.95) }); side(s, 1.519, 2.2, 2.6, 2.545, 2.945);
    for (let i = 0; i < 5; i++) { const z = 1.86 + i * 0.27, x = s * 1.535, ph = (i * 0.37 + (s > 0 ? 0.2 : 0.6)) % 1;
      S({ tile: -2, kind: 3, param: 0.3, pivot: [x, 2.98, z, ph], tint: jew[(i + (s > 0 ? 0 : 2)) % 4] }); G.quad([x, 2.76, z], [x, 2.85, z + 0.055], [x, 2.98, z], [x, 2.85, z - 0.055], [0, 0, 0.06, 0.1]); }
    S({ tile: T.sun[0] + 1, tint: [1.0, 0.85, 0.5] }); G.quad([s * 1.62, 2.55, 3.36], [s * 1.86, 2.75, 3.36], [s * 1.62, 2.95, 3.36], [s * 1.38, 2.75, 3.36]);
    S({ tile: -3 }); G.box(s * 1.56, 2.75, 3.33, 0.12, 0.05, 0.05);
  }
  S({ tile: -3, tint: [0.7, 0.9, 1.6] }); G.quad([-1.38, 2.4, 3.31], [1.38, 2.4, 3.31], [1.38, 3.2, 3.31], [-1.38, 3.2, 3.31]);
  S({ tile: 100 + 6, tint: dirt(0.9) }); G.quad([-1.5, 2.3, 3.32], [1.5, 2.3, 3.32], [1.5, 2.42, 3.32], [-1.5, 2.42, 3.32], [0, 0.4, 6, 0.6]);
  S({ tile: -2, tint: RED }); G.quad([-0.05, 2.4, 3.325], [0.05, 2.4, 3.325], [0.05, 3.2, 3.325], [-0.05, 3.2, 3.325], [0, 0, 0.05, 0.4]);
  for (let i = 0; i < 11; i++) { const x = -1.25 + i * 0.25, ph = rng(), c = jew[i % 4];
    S({ tile: -2, kind: 3, param: 0.3, pivot: [x, 3.2, 3.33, ph], tint: c }); G.quad([x, 2.86, 3.33], [x + 0.06, 2.98, 3.33], [x, 3.2, 3.33], [x - 0.06, 2.98, 3.33], [0, 0, 0.06, 0.1]); }
  yield;
  // cargo body: skirt band, four raised panels a side, ribs, scalloped top rail, side chains
  S({ tile: -4, tint: dirt(0.8) }); G.box(0, 2.7, -1.5, 3.0, 2.6, 6.0, 'xXzZy');
  for (const s of [-1, 1]) {
    S({ tile: 100 + 6, tint: dirt(0.75) }); side(s, 1.51, -4.5, 1.5, 1.42, 1.9, [0, 0.14, 6, 0.86]);
    S({ tile: T.scallops, tint: dirt(0.95) }); side(s, 1.51, -4.5, 1.5, 3.78, 4.0, [0, 0.38, 8, 0.62]);
    for (let i = 0; i < 4; i++) { const z0 = -4.42 + i * 1.48; S({ tile: 100 + ((i + (s > 0 ? 0 : 1)) % 2), tint: dirt(0.92 + 0.08 * rng()) }); sidePanel(s, 1.5, z0, z0 + 1.4, 1.96, 3.72, 0.06, 0.05); }
    for (let i = 0; i < 5; i++) { const z = -4.46 + i * 1.48; S({ tile: -2, tint: i % 2 ? GLD : WHT }); side(s, 1.57, z - 0.035, z + 0.035, 1.94, 3.76, [0, 0, 0.035, 0.9]); }
    for (let i = 0; i < 12; i++) chain(s * 1.53, 1.42, -4.3 + i * 0.5, 0.22 + (i % 3) * 0.07, s, 0, jew[(i + (s > 0 ? 1 : 0)) % 3], 0.3);
    // a row of tin flags along the top rail (silhouette breakup)
    for (let i = 0; i < 7; i++) { const z = -4.2 + i * 0.9; S({ tile: -2, tint: jew[i % 4] }); G.tri([s * 1.5, 4.0, z - 0.2], [s * 1.5, 4.0, z + 0.2], [s * 1.56, 4.42, z], [0, 0], [0.2, 0], [0.1, 0.2]); }
  }
  yield;
  // tailgate, rear bumper, flaps
  S({ tile: 100 + 5, tint: dirt(0.9) }); G.panel([1.36, 1.6, -4.5], [-1, 0, 0], [0, 1, 0], [0, 0, -1], 2.72, 2.3, 0.07, 0.06);
  S({ tile: 100 + 6, tint: dirt(0.8) }); G.quad([1.5, 1.05, -4.52], [-1.5, 1.05, -4.52], [-1.5, 1.4, -4.52], [1.5, 1.4, -4.52], [0, 0.25, 5, 0.75]);
  for (let i = 0; i < 9; i++) chain(-1.4 + i * 0.35, 1.05, -4.54, 0.25, 0, -1, jew[i % 3], 0.3);
  // tarpaulined load: a lumpy hump, lashed
  { const nx = 4, nz = 7, hgt = (i, j) => 3.98 + Math.sin((i / nx) * Math.PI) * (0.55 + 0.25 * Math.sin(j * 1.7 + 0.4)) * Math.sin(Math.min(1, (j + 0.35) / 1.2) * 1.5708) * Math.sin(Math.min(1, (nz - j + 0.35) / 1.2) * 1.5708);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const X = (a) => -1.46 + (a / nx) * 2.92, Z = (b) => -4.46 + (b / nz) * 5.9;
      // seen from the air the load is painted too: two great motifs down the middle of the tarpaulin, tape lashings across it
      // each of the eight middle quads is one whole motif, so close to the load reads as cloth with painted medallions
      const mid = (i === 1 || i === 2) && j >= 1 && j <= 4;
      if (mid) S({ tile: 100 + [1, 0, 7, 3][(i + j) % 4], tint: dirt(0.85) }); else S({ tile: -1, tint: (j % 3 === 1) ? [0.025, 0.035, 0.055] : [0.018, 0.023, 0.038] });
      G.quad([X(i), hgt(i, j), Z(j)], [X(i), hgt(i, j + 1), Z(j + 1)], [X(i + 1), hgt(i + 1, j + 1), Z(j + 1)], [X(i + 1), hgt(i + 1, j), Z(j)], mid ? [0, 0, 1, 1] : [i / nx, j / nz, (i + 1) / nx, (j + 1) / nz]);
      if (j > 0) { S({ tile: -2, tint: j % 2 ? GLD : WHT }); G.quad([X(i), hgt(i, j) + 0.03, Z(j) - 0.05], [X(i), hgt(i, j) + 0.03, Z(j) + 0.05], [X(i + 1), hgt(i + 1, j) + 0.03, Z(j) + 0.05], [X(i + 1), hgt(i + 1, j) + 0.03, Z(j) - 0.05], [0, 0, 0.06, 0.4]); }
    } }
  yield;
  // THE CROWN: a carved prow leaning out over the cab, flaring and rising to an ogee point
  { const rows = [[3.3, 3.34, 1.5], [3.62, 4.15, 1.62], [3.92, 5.05, 1.76], [4.1, 5.95, 1.88], [4.08, 6.3, 1.9]];
    const nx = 6, topY = (x) => 6.28 + 0.72 * Math.pow(1 - Math.abs(x), 0.75) + 0.1 * Math.cos(x * 9.42);
    const Pf = (i, j, back) => { const u = (i / nx) * 2 - 1, r = rows[j]; let y = r[1], z = r[0]; if (j === 4) { y = topY(u); z -= (y - 6.3) * 0.12; } return [u * r[2], y, z - (back ? 0.22 + j * 0.05 : 0)]; };
    for (let j = 0; j < 4; j++) for (let i = 0; i < nx; i++) {
      let tile, r;
      if (j === 0) { tile = 100 + 6; r = [i * 0.5, 0.2, i * 0.5 + 0.5, 0.8]; }
      else if (j < 3) { tile = 100 + 3; const h = i < 3 ? i : i - 3; r = [h / 3, (j - 1) / 2, (h + 1) / 3, j / 2]; }
      else { tile = 100 + 4; const h = i % 2; r = [h / 2, 0.08, (h + 1) / 2, 0.92]; }
      S({ tile, tint: dirt(0.97) }); G.quad(Pf(i, j), Pf(i + 1, j), Pf(i + 1, j + 1), Pf(i, j + 1), r);
      S({ tile: j === 0 || j === 3 ? 100 + 6 : 100 + 7, tint: dirt(0.7) }); G.quad(Pf(i + 1, j, 1), Pf(i, j, 1), Pf(i, j + 1, 1), Pf(i + 1, j + 1, 1), j === 0 || j === 3 ? [i * 0.5, 0.2, i * 0.5 + 0.5, 0.8] : [1 - (i + 1) / nx, (j - 1) / 2, 1 - i / nx, j / 2]);
    }
    S({ tile: -2, tint: GLD }); for (let i = 0; i < nx; i++) G.quad(Pf(i, 4), Pf(i + 1, 4), Pf(i + 1, 4, 1), Pf(i, 4, 1), [0, 0, 0.3, 0.1]);
    for (const s of [-1, 1]) {
      const i = s > 0 ? nx : 0;
      for (let j = 0; j < 4; j++) { S({ tile: -2, tint: j % 2 ? RED : WHT }); if (s > 0) G.quad(Pf(i, j), Pf(i, j, 1), Pf(i, j + 1, 1), Pf(i, j + 1), [0, 0, 0.1, 0.4]); else G.quad(Pf(i, j, 1), Pf(i, j), Pf(i, j + 1), Pf(i, j + 1, 1), [0, 0, 0.1, 0.4]); }
      // cheeks: carved side wings joining the crown to the load
      const B0 = [s * 1.5, 3.34, 1.5], B1 = [s * 1.5, 4.0, 1.5], B2 = [s * 1.52, 4.75, 1.2];
      S({ tile: 100 + 4, tint: dirt(0.9) });
      const m = (p) => [p[0], p[1], p[2] - 0.2];
      if (s > 0) { G.quad(m(Pf(i, 0)), B0, B1, m(Pf(i, 1)), [1, 0, 0, 0.35]); G.quad(m(Pf(i, 1)), B1, B2, m(Pf(i, 2)), [1, 0.35, 0, 0.7]); G.tri(m(Pf(i, 2)), B2, m(Pf(i, 3)), [1, 0.7], [0, 0.7], [0.9, 1]); }
      else { G.quad(B0, m(Pf(i, 0)), m(Pf(i, 1)), B1, [0, 0, 1, 0.35]); G.quad(B1, m(Pf(i, 1)), m(Pf(i, 2)), B2, [0, 0.35, 1, 0.7]); G.tri(B2, m(Pf(i, 2)), m(Pf(i, 3)), [0, 0.7], [1, 0.7], [0.1, 1]); }
    }
    // finials along the crest
    for (const u of [-0.92, -0.5, 0.5, 0.92]) { S({ tile: -2, tint: u * u > 0.5 ? RED : GRN }); G.lathe(u * 1.9, topY(u) - 0.05, 3.96, [[0.05, 0], [0.11, 0.16], [0.03, 0.3], [0, 0.62]], 5, 0.3); }
    // a fringe of little bells under the crown's lip
    for (let i = 0; i < 12; i++) chain(-1.4 + i * 0.255, 3.36, 3.36, 0.14, 0, 1, jew[(i + 1) % 4], 0.4);
  }
  yield;
  // carved wings running back from the crown along the load, a scalloped arch over the tailgate
  for (const s of [-1, 1]) {
    const n = 6, top = (t) => 4.0 + 1.55 * Math.pow(1 - t, 1.4) + 0.1 * Math.abs(Math.sin(t * n * Math.PI)) + 0.12;
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, z0 = 1.5 - t0 * 3.2, z1 = 1.5 - t1 * 3.2, x = s * 1.53;
      S({ tile: 100 + 4, tint: dirt(0.95) }); G.quad([x, 4.0, z0], [x, 4.0, z1], [x, top(t1), z1], [x, top(t0), z0], [t0 * 1.5, 0.05, t1 * 1.5, 0.95]);
      S({ tile: -2, tint: i % 2 ? GLD : RED }); G.quad([x - s * 0.05, top(t0), z0], [x - s * 0.05, top(t1), z1], [x + s * 0.07, top(t1) + 0.03, z1], [x + s * 0.07, top(t0) + 0.03, z0], [0, 0, 0.06, 0.3]); }
    // spray off the rear tyres: a few tape-bright droplets that rise and fall (kind 6)
    for (let i = 0; i < 9; i++) { const px = s * (1.0 + 0.45 * rng()), pz = -3.85 - 0.3 * rng(), ph = rng(), w = 0.035 + 0.03 * rng();
      S({ tile: -2, kind: 6, param: (rng() - 0.5) * 1.2, pivot: [px, 0.22, pz, ph], tint: [0.75, 0.82, 0.95] });
      G.quad([px, 0.22 - w, pz], [px + w, 0.22, pz], [px, 0.22 + w, pz], [px - w, 0.22, pz], [0, 0, 0.04, 0.04]); }
  }
  { const n = 6; for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, y = (u) => 4.0 + 0.85 * Math.sin(u * Math.PI) + 0.06;
      S({ tile: 100 + 7, tint: dirt(0.9) }); G.quad([1.4 - u0 * 2.8, 4.0, -4.5], [1.4 - u1 * 2.8, 4.0, -4.5], [1.4 - u1 * 2.8, y(u1), -4.5], [1.4 - u0 * 2.8, y(u0), -4.5], [u0, 0.05, u1, 0.95]); } }
  yield;
  // THE PEACOCK on the crest, with its hinged tin tail (kind 2: fans open as the camera comes alongside)
  { const px = 0, py = 6.92, pz = 3.9;
    S({ tile: -2, tint: BLU }); G.lathe(px, py - 0.05, pz + 0.12, [[0, 0], [0.16, 0.12], [0.2, 0.32], [0.1, 0.56], [0.06, 0.8], [0.1, 0.92], [0, 1.02]], 6, 0.4);
    S({ tile: -2, tint: GLD }); G.tri([px - 0.04, py + 0.86, pz + 0.2], [px + 0.04, py + 0.86, pz + 0.2], [px, py + 0.8, pz + 0.42], [0, 0], [0.1, 0], [0.05, 0.1]);
    for (let i = -1; i <= 1; i++) G.tri([px + i * 0.05 - 0.02, py + 0.95, pz + 0.1], [px + i * 0.05 + 0.02, py + 0.95, pz + 0.1], [px + i * 0.09, py + 1.2, pz + 0.06], [0, 0], [0.1, 0], [0.05, 0.1]);
    const piv = [px, py, pz - 0.08];
    for (let layer = 0; layer < 2; layer++) { const n = layer ? 8 : 11, len = layer ? 1.25 : 1.9, wid = layer ? 0.3 : 0.36;
      for (let i = 0; i < n; i++) { const ang = ((i / (n - 1)) * 2 - 1) * 1.42, z = piv[2] - 0.02 - layer * 0.03 - (i % 2) * 0.012;
        S({ tile: T.feather[0] + ((i + layer) % 2), kind: 2, param: ang, pivot: [piv[0], piv[1], piv[2], rng()], tint: [1, 1, 1] });
        G.quad([px - wid * 0.25, py, z], [px + wid * 0.25, py, z], [px + wid, py + len, z], [px - wid, py + len, z]); } }
  }
}

// A cheap shell of the same truck for the wet-deck mirror: flanks, crown front, tailgate, crown fan.
function buildTruckShell(G) {
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  for (const s of [-1, 1]) {
    const side = (x, z0, z1, y0, y1, r) => { if (s > 0) G.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], r); else G.quad([-x, y0, z0], [-x, y0, z1], [-x, y1, z1], [-x, y1, z0], r); };
    S({ tile: 100 + 6 }); side(1.51, -4.5, 1.5, 1.42, 1.9, [0, 0.14, 6, 0.86]); S({ tile: T.scallops }); side(1.51, -4.5, 1.5, 3.78, 4.0, [0, 0.38, 8, 0.62]);
    for (let i = 0; i < 4; i++) { const z0 = -4.42 + i * 1.48; S({ tile: 100 + ((i + (s > 0 ? 0 : 1)) % 2) }); side(1.56, z0, z0 + 1.4, 1.96, 3.72); }
    S({ tile: 100 + 2 }); side(1.55, 1.62, 3.18, 1.22, 2.42); S({ tile: -4 }); side(1.5, 1.5, 3.3, 2.42, 3.34); side(1.18, 3.3, 4.42, 1.15, 1.95);
    S({ tile: 100 + 4 }); side(1.6, 1.4, 3.6, 3.4, 5.4);
  }
  S({ tile: 100 + 6 }); G.quad([-1.6, 0.8, 4.64], [1.6, 0.8, 4.64], [1.6, 1.16, 4.64], [-1.6, 1.16, 4.64], [0, 0.25, 5, 0.75]);
  G.quad([-1.06, 1.15, 4.42], [1.06, 1.15, 4.42], [1.06, 1.95, 4.42], [-1.06, 1.95, 4.42], [0, 0, 2, 1]);
  S({ tile: 100 + 3 }); G.quad([-1.7, 4.15, 3.7], [0, 4.15, 3.7], [0, 5.95, 4.1], [-1.9, 5.95, 4.1]); G.quad([0, 4.15, 3.7], [1.7, 4.15, 3.7], [1.9, 5.95, 4.1], [0, 5.95, 4.1]);
  S({ tile: 100 + 4 }); G.quad([-1.9, 5.95, 4.1], [1.9, 5.95, 4.1], [1.2, 6.7, 4.05], [-1.2, 6.7, 4.05], [0, 0.08, 3, 0.92]);
  S({ tile: 100 + 5 }); G.quad([1.36, 1.6, -4.56], [-1.36, 1.6, -4.56], [-1.36, 3.9, -4.56], [1.36, 3.9, -4.56]);
  for (let i = 0; i < 7; i++) { const ang = ((i / 6) * 2 - 1) * 1.42; S({ tile: T.feather[0] + (i % 2), kind: 2, param: ang, pivot: [0, 6.92, 3.82, 0.3] }); G.quad([-0.1, 6.92, 3.8], [0.1, 6.92, 3.8], [0.42, 8.82, 3.8], [-0.42, 8.82, 3.8]); }
}

// ------------------------------------------------------------------------------------------------
// Towers: 46 m panel-clad gate towers, each pierced by a horseshoe arch 14.6 m across. The face is a
// voussoir ring, a scalloped ring, then a sunburst of rays that becomes a peacock's fan over the
// keystone; above it two tiers of motif panels, a pair of great eyes and an ogee crest.
// gateOn writes ignition order into aFx.y (sill first, round the arch, up the fan, up the tower).
// ------------------------------------------------------------------------------------------------
function* towerFace(G, pal, rng, gateOn, lite) {      // a generator, like buildTower: each yield is a place the build may hand the page back
  const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const RED = C(pal[2]), GRN = C(pal[3]), GLD = C(pal[4]), BLU = C(pal[5]), WHT = C(pal[6], 0.9);
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  const gt = (v) => (gateOn ? v : 0);
  const Z = 3.5, N = 44, th0 = -Math.asin(ARCH_Y / ARCH_R), span = Math.PI - 2 * th0;
  const ang = (i) => th0 + (i / N) * span;
  const prog = (a) => { const b = a > Math.PI / 2 ? Math.PI - a : a; return (b - th0) / (Math.PI / 2 - th0); };
  const P = (a, r, z) => [Math.cos(a) * r, ARCH_Y + Math.sin(a) * r, z];
  const edge = (a) => { const c = Math.cos(a), s = Math.sin(a); let t = 13 / Math.max(Math.abs(c), 1e-4); if (s > 1e-4) t = Math.min(t, (25 - ARCH_Y) / s); if (s < -1e-4) t = Math.min(t, ARCH_Y / -s); return t; };
  const R1 = ARCH_R + 1.5, R2 = ARCH_R + 2.4;
  for (let i = 0; i < N; i++) {
    const a0 = ang(i), a1 = ang(i + 1), g0 = gt(0.04 + 0.5 * prog(a0)), g1 = gt(0.04 + 0.5 * prog(a1));
    // voussoirs, proud of the face
    S({ tile: -2, tint: [RED, WHT, GRN, WHT][i % 4] });
    G.quad(P(a0, ARCH_R, Z + 0.3), P(a0, R1 - 0.06, Z + 0.3), P(a1, R1 - 0.06, Z + 0.3), P(a1, ARCH_R, Z + 0.3), [0, 0, 0.75, 0.45], [g0, g0, g1, g1]);
    S({ tile: -3 }); G.quad(P(a0, R1 - 0.06, Z + 0.3), P(a0, R1, Z), P(a1, R1, Z), P(a1, R1 - 0.06, Z + 0.3));
    S({ tile: T.scallops, tint: [1, 1, 1] });
    G.quad(P(a0, R1, Z), P(a0, R2, Z), P(a1, R2, Z), P(a1, R1, Z), [0.1, i * 0.5, 0.9, i * 0.5 + 0.5], [g0 + gt(0.04), g0 + gt(0.06), g1 + gt(0.06), g1 + gt(0.04)]);
    // rays: the peacock's fan above, a sunburst at the flanks
    const am = (a0 + a1) / 2, fan = Math.abs(am - Math.PI / 2) < 1.02, e0 = Math.max(edge(a0), R2 + 0.3), e1 = Math.max(edge(a1), R2 + 0.3);
    S({ tile: -3 }); G.quad(P(a1, R2, Z), P(a0, R2, Z), P(a0, e0, Z), P(a1, e1, Z));
    if (fan) { S({ tile: T.feather[0] + (i % 2) }); const gi = gt(0.6), go = gt(1.0);
      G.quad(P(a1, R2 + 0.15, Z + 0.06), P(a0, R2 + 0.15, Z + 0.06), P(a0, e0, Z + 0.06), P(a1, e1, Z + 0.06), [0.3, 0, 0.7, 1], [gi, gi, go, go]); }
    else { const w = (a1 - a0) * 0.12; S({ tile: i % 2 ? -2 : -1, tint: i % 2 ? GLD : C(pal[5], 0.6) }); const gi = g0 + gt(0.1), go = g0 + gt(0.25);
      G.quad(P(a1 - w, R2 + 0.15, Z + 0.06), P(a0 + w, R2 + 0.15, Z + 0.06), P(a0 + w, e0, Z + 0.06), P(a1 - w, e1, Z + 0.06), [0, 0, 0.5, (e0 - R2) * 0.5], [gi, gi, go, go]); }
    if (i % 6 === 5) yield;
  }
  yield;
  // cornice 1, tier 2 with two rows of five panels, cornice 2, tier 3 with the great eyes, crest
  const band = (y0, y1, hw, out, tile, rep, g) => { S({ tile }); G.quad([-hw, y0, Z + out], [hw, y0, Z + out], [hw, y1, Z + out], [-hw, y1, Z + out], [0, 0.2, rep, 0.8], [g, g, g, g]); S({ tile: -3 }); G.quad([-hw, y1, Z + out], [hw, y1, Z + out], [hw, y1, Z - 0.2], [-hw, y1, Z - 0.2]); G.quad([-hw, y0, Z], [hw, y0, Z], [hw, y0, Z + out], [-hw, y0, Z + out]); };
  band(25, 26.3, 13.3, 0.5, T.chevrons, 10, gt(0.9));
  S({ tile: -3 }); G.quad([-10.5, 26.3, Z], [10.5, 26.3, Z], [10.5, 36, Z], [-10.5, 36, Z]);
  const rowA = [T.cypress, T.fish, T.sun, T.fish, T.cypress], rowB = [T.flower, T.bird, T.peacock, T.bird, T.flower];
  for (let i = 0; i < 5; i++) {
    const x = -9.9 + i * 4.0; let g = gt(0.93);
    S({ tile: rowA[i][0] + rng.int(0, rowA[i][1] - 1), gate: g }); G.panel([x, 26.8, Z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 3.8, 4.1, 0.14, 0.1);
    g = gt(0.97); S({ tile: rowB[i][0] + rng.int(0, rowB[i][1] - 1), gate: g }); G.panel([x, 31.3, Z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 3.8, 4.1, 0.14, 0.1);
    if (i === 2) yield;
  }
  yield;
  band(36, 37, 10.9, 0.45, T.diamonds, 9, gt(1.0));
  S({ tile: -3 }); G.quad([-7.7, 37, Z], [7.7, 37, Z], [7.7, 43, Z], [-7.7, 43, Z]);
  const eyeT = T.eye[0] + rng.int(0, T.eye[1] - 1);
  S({ tile: eyeT, gate: gt(1.03) }); G.panel([-6.9, 37.6, Z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 5.0, 5.0, 0.16, 0.1);
  G.panel([1.9, 37.6, Z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 5.0, 5.0, 0.16, 0.1, [1, 0, 0, 1]);
  S({ tile: T.heart[0] + rng.int(0, 1), gate: gt(1.03) }); G.panel([-1.5, 38.6, Z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 3.0, 3.0, 0.16, 0.1);
  { const n = 12, hw = 8.2, top = (u) => 43.6 + 2.6 * Math.pow(1 - Math.abs(u), 0.8) + 0.35 * Math.cos(u * 6 * Math.PI);
    for (let i = 0; i < n; i++) { const u0 = (i / n) * 2 - 1, u1 = ((i + 1) / n) * 2 - 1; S({ tile: T.sun[0] + (i % 3), gate: gt(1.06) });
      G.quad([u0 * hw, 43, Z + 0.3], [u1 * hw, 43, Z + 0.3], [u1 * hw, top(u1), Z + 0.3], [u0 * hw, top(u0), Z + 0.3], [(i % 2) * 0.5, 0.1, (i % 2) * 0.5 + 0.5, 0.9]);
      S({ tile: -2, tint: GLD }); G.quad([u0 * hw, top(u0), Z + 0.3], [u1 * hw, top(u1), Z + 0.3], [u1 * hw, top(u1), Z - 0.4], [u0 * hw, top(u0), Z - 0.4], [0, 0, 0.5, 0.3]); }
    S({ tile: -3 }); G.quad([-hw, 43, Z - 0.2], [hw, 43, Z - 0.2], [hw, 43, Z + 0.3], [-hw, 43, Z + 0.3]);
  }
  if (lite) return;
  // corner turrets with banded shafts and onion caps
  for (const s of [-1, 1]) {
    S({ tile: T.bands, tint: [1, 1, 1], gate: gt(0.95) }); G.lathe(s * 11.9, 26.3, Z - 1.3, [[1.25, 0], [1.25, 7.5]], 8, 3);
    S({ tile: -2, tint: s > 0 ? GRN : GRN, gate: gt(1.0) }); G.lathe(s * 11.9, 33.8, Z - 1.3, [[1.25, 0], [1.6, 0.3], [1.9, 1.3], [1.6, 2.5], [0.8, 3.5], [0.25, 4.2], [0.12, 5.6], [0.3, 5.9], [0, 6.4]], 8, 2);
  }
}

function* buildTower(G, pal, rng, z0, gateOn) {      // a generator: each yield is a place the build may hand the page back
  const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  G.at(0, 0, z0, 0); yield* towerFace(G, pal, rng, gateOn, false); G.pop(); yield;
  G.at(0, 0, z0, Math.PI); yield* towerFace(G, pal, rng, false, false); G.pop(); yield;
  G.at(0, 0, z0, 0);
  // intrados of the horseshoe
  const N = 44, th0 = -Math.asin(ARCH_Y / ARCH_R), span = Math.PI - 2 * th0;
  for (let i = 0; i < N; i++) {
    const a0 = th0 + (i / N) * span, a1 = th0 + ((i + 1) / N) * span, b = (a) => { const q = a > Math.PI / 2 ? Math.PI - a : a; return gateOn ? 0.04 + 0.5 * (q - th0) / (Math.PI / 2 - th0) : 0; };
    const p = (a, z) => [Math.cos(a) * ARCH_R, ARCH_Y + Math.sin(a) * ARCH_R, z];
    S({ tile: i % 2 ? T.diamonds : T.checks, tint: [0.55, 0.55, 0.55] }); G.quad(p(a1, 3.8), p(a0, 3.8), p(a0, -3.8), p(a1, -3.8), [0, 0, 0.5, 4], [b(a1), b(a0), b(a0), b(a1)]);
    if (i % 12 === 11) yield;
  }
  yield;
  // flanks: panel grids; shoulders and caps
  const kinds = [T.flower, T.sun, T.fish, T.bird, T.cypress, T.peacock];
  for (const s of [-1, 1]) {
    S({ tile: -3 }); if (s > 0) G.quad([13, 0, 3.5], [13, 0, -3.5], [13, 25, -3.5], [13, 25, 3.5]); else G.quad([-13, 0, -3.5], [-13, 0, 3.5], [-13, 25, 3.5], [-13, 25, -3.5]);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 2; i++) { const k = kinds[(i + j * 2) % 6]; S({ tile: k[0] + rng.int(0, k[1] - 1) });
      if (s > 0) G.panel([13, 0.9 + j * 4.8, 3.2 - i * 3.3], [0, 0, -1], [0, 1, 0], [1, 0, 0], 3.1, 4.3, 0.14, 0.1); else G.panel([-13, 0.9 + j * 4.8, -3.2 + i * 3.3], [0, 0, 1], [0, 1, 0], [-1, 0, 0], 3.1, 4.3, 0.14, 0.1);
      if (i === 1 && j % 3 === 2) yield; }
    S({ tile: -3 });
    for (const [x, y0, y1] of [[10.5, 26.3, 36], [7.7, 37, 43]]) { if (s > 0) G.quad([x, y0, 3.5], [x, y0, -3.5], [x, y1, -3.5], [x, y1, 3.5]); else G.quad([-x, y0, -3.5], [-x, y0, 3.5], [-x, y1, 3.5], [-x, y1, -3.5]); }
    S({ tile: T.sun[0] + rng.int(0, 5) }); if (s > 0) G.panel([10.5, 28.4, 2.9], [0, 0, -1], [0, 1, 0], [1, 0, 0], 5.8, 5.8, 0.14, 0.1); else G.panel([-10.5, 28.4, -2.9], [0, 0, 1], [0, 1, 0], [-1, 0, 0], 5.8, 5.8, 0.14, 0.1);
    // cable saddles and crest finials
    S({ tile: -2, tint: C(pal[4]) }); G.lathe(s * CABLE_X, 45.2, 0, [[1.0, 0], [1.0, 0.8], [0.5, 1.5], [0.2, 2.6], [0.45, 3.0], [0, 3.6]], 6, 2);
    // piers below the deck
    S({ tile: -1, tint: [0.03, 0.035, 0.05] }); G.box(s * 10, -8, 0, 7, 16, 8.4, 'xXzZ');
    S({ tile: T.checks }); for (const zz of [4.22, -4.22]) { const q = zz > 0 ? 1 : -1; G.quad([s * 10 - 3.5 * q, -1.4, zz], [s * 10 + 3.5 * q, -1.4, zz], [s * 10 + 3.5 * q, -0.1, zz], [s * 10 - 3.5 * q, -0.1, zz], [0, 0, 5, 0.5]); }
    yield;
  }
  S({ tile: -3 }); G.quad([-13, 25, 3.5], [13, 25, 3.5], [13, 25, -3.5], [-13, 25, -3.5]); G.quad([-10.5, 36, 3.5], [10.5, 36, 3.5], [10.5, 36, -3.5], [-10.5, 36, -3.5]); G.quad([-7.7, 43, 3.5], [7.7, 43, 3.5], [7.7, 43, -3.5], [-7.7, 43, -3.5]);
  S({ tile: -2, tint: C(pal[2]) }); G.lathe(0, 46, 0, [[0.9, 0], [1.3, 0.6], [0.9, 1.6], [0.3, 2.4], [0.2, 4.2], [0.5, 4.6], [0, 5.4]], 6, 2);
  S({ tile: -1, tint: [0.03, 0.035, 0.05] }); G.box(0, -8.3, 0, 13, 15.4, 8.4, 'zZ');
  G.pop();
}

// Deck furniture, girders, cables: everything static that is not a tower.
function* buildSpan(G, pal, rng) {
  const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  const L = HALF + 14, fields = [T.diamonds, T.chevrons, T.scallops, T.stripes, T.diamonds, T.checks];
  for (const s of [-1, 1]) {
    for (let k = -22; k < 22; k++) {
      const z0 = Math.max(-L, k * 10), z1 = Math.min(L, k * 10 + 10), n = (z1 - z0) / 1.25, f = fields[((k + 44) * 7 + (s > 0 ? 0 : 3)) % 6], w = 0.85 + 0.15 * rng();
      const inner = (x, y0, y1, r) => { if (s > 0) G.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], r); else G.quad([-x, y0, z1], [-x, y0, z0], [-x, y1, z0], [-x, y1, z1], r); };
      const outer = (x, y0, y1, r) => { if (s > 0) G.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], r); else G.quad([-x, y0, z0], [-x, y0, z1], [-x, y1, z1], [-x, y1, z0], r); };
      S({ tile: T.checks, tint: [w, w, w] }); inner(5.62, 0, 0.26, [0, 0, n, 0.5]);
      S({ tile: f, tint: [w, w, w] }); inner(5.8, 0.3, 1.25, [0, 0.02, n, 0.98]); outer(6.0, 0.3, 1.25, [0, 0.02, n, 0.98]);
      S({ tile: -2, tint: C(pal[6], 0.8) }); G.quad([s * 5.78, 1.25, s > 0 ? z1 : z0], [s * 6.02, 1.25, s > 0 ? z1 : z0], [s * 6.02, 1.25, s > 0 ? z0 : z1], [s * 5.78, 1.25, s > 0 ? z0 : z1], [0, 0, 0.12, n * 0.6]);
      S({ tile: -3 }); G.quad([s * 5.62, 0.26, s > 0 ? z1 : z0], [s * 5.8, 0.3, s > 0 ? z1 : z0], [s * 5.8, 0.3, s > 0 ? z0 : z1], [s * 5.62, 0.26, s > 0 ? z0 : z1]);
      // fascia girder with one sunburst a bay
      S({ tile: -1, tint: C(pal[5], 0.12) }); outer(6.4, -2.6, 0.3);
      S({ tile: T.sun[0] + ((k + 44) % 6), tint: [w * 0.5, w * 0.5, w * 0.5] }); if (s > 0) G.panel([6.4, -2.45, z0 + 6.3], [0, 0, -1], [0, 1, 0], [1, 0, 0], 2.6, 2.6, 0.08, 0.06); else G.panel([-6.4, -2.45, z0 + 3.7], [0, 0, 1], [0, 1, 0], [-1, 0, 0], 2.6, 2.6, 0.08, 0.06);
      S({ tile: -3 }); G.quad([s * 6.0, 0.3, s > 0 ? z1 : z0], [s * 6.4, 0.3, s > 0 ? z1 : z0], [s * 6.4, 0.3, s > 0 ? z0 : z1], [s * 6.0, 0.3, s > 0 ? z0 : z1]);
      if ((k + 22) % 11 === 10) yield;
    }
    yield;
    // bottom chord and truss web (ribbons that never fall below a pixel and a half)
    S({ tile: -1, tint: C(pal[5], 0.1) }); G.box(s * 6.1, -6.2, 0, 0.5, 0.5, 2 * HALF, 'xXyY');
    for (let k = -20; k < 20; k++) { const z = k * 10 + 5;
      for (const [za, ya, zb, yb] of [[z - 5, -2.6, z - 5, -6.2], [z - 5, -6.2, z, -2.6], [z, -2.6, z + 5, -6.2]]) {
        const d = new THREE.Vector3(0, yb - ya, zb - za).normalize();
        for (const sg of [-1, 1]) { S({ tile: -1, kind: 4, param: 0.11 * sg, pivot: [d.x, d.y, d.z, 0], tint: C(pal[5], 0.1) }); }
        const A = [s * 6.1, ya, za], B = [s * 6.1, yb, zb], st = G.st;
        st.param = -0.11; G.v(A, [s, 0, 0], 0, 0); G.v(B, [s, 0, 0], 0, 1); st.param = 0.11; G.v(B, [s, 0, 0], 1, 1);
        st.param = -0.11; G.v(A, [s, 0, 0], 0, 0); st.param = 0.11; G.v(B, [s, 0, 0], 1, 1); G.v(A, [s, 0, 0], 1, 0);
      } }
    yield;
    // main cable and backstays: banded tubes
    const tube = (pts, rad, sides) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1];
      for (let j = 0; j < sides; j++) { const t0 = (j / sides) * TAU, t1 = ((j + 1) / sides) * TAU; const o = (t) => [Math.cos(t), Math.sin(t) * 0.97, -Math.sin(t) * 0.24 * Math.sign(a[1] - b[1] || 1) * 0];
        const n0 = o(t0), n1 = o(t1), q = (p, n) => [p[0] + n[0] * rad, p[1] + n[1] * rad, p[2]];
        G.quadN(q(a, n0), q(a, n1), q(b, n1), q(b, n0), n0, n1, n1, n0, [j / sides, i, (j + 1) / sides, i + 1]); } } };
    S({ tile: T.bands, tint: [0.95, 0.95, 0.95] });
    const pts = []; for (let i = 0; i <= 82; i++) { const z = -HALF + i * 5; pts.push([s * CABLE_X, 6 + (TOWER_H - 6.6) * (z / HALF) * (z / HALF), z]); }
    tube(pts.slice(0, 42), 0.34, 6); yield;
    tube(pts.slice(41), 0.34, 6); yield;
    for (const e of [-1, 1]) { const bs = []; for (let i = 0; i <= 6; i++) { const u = i / 6; bs.push([s * CABLE_X, 45.4 - 44.2 * u, e * (HALF + 78 * u)]); } tube(bs, 0.34, 6); S({ tile: -1, tint: [0.03, 0.035, 0.05] }); G.box(s * CABLE_X, -1, e * (HALF + 80), 3, 5, 6); S({ tile: T.bands, tint: [0.95, 0.95, 0.95] }); yield; }
  }
  yield;
  // cross beams and soffit under the deck
  S({ tile: -3 }); G.quad([-6, -0.3, -L], [6, -0.3, -L], [6, -0.3, L], [-6, -0.3, L]);
  S({ tile: -1, tint: C(pal[5], 0.1) }); for (let k = -20; k <= 20; k++) G.box(0, -1.5, k * 10, 12.4, 2.2, 0.5, 'yzZ');
}

// Hangers (ribbons) and the pennants they carry; shared by the lit mesh and the deck mirror.
function* buildHangers(G, pal, rng) {
  const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
  const jew = [C(pal[2]), C(pal[4]), C(pal[3]), C(pal[5]), C(pal[6], 0.62)]      // the white pennant is held down so the nearest ones keep their shape in the beam;
  const S = (o) => G.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [1, 1, 1] }, o));
  const order = rng.shuffle([0, 1, 2, 3, 4]);
  for (let k = 0; k <= 40; k++) for (const s of [-1, 1]) {
    const z = -200 + k * 10, top = 6 + (TOWER_H - 6.6) * (z / HALF) * (z / HALF) - 0.2, x = s * CABLE_X, len = top - 0.3, st = G.st;
    S({ tile: T.bands, kind: 4, pivot: [0, 1, 0, 0] });
    const A = [x, 0.3, z], B = [x, top, z], vr = len / 2.4, nn = [0, 0, 1];
    st.param = -0.075; G.v(A, nn, 0.2, 0); st.param = 0.075; G.v(A, nn, 0.8, 0); G.v(B, nn, 0.8, vr);
    st.param = -0.075; G.v(A, nn, 0.2, 0); st.param = 0.075; G.v(B, nn, 0.8, vr); st.param = -0.075; G.v(B, nn, 0.2, vr);
    // post finial on the rail
    S({ tile: -2, tint: jew[1] }); G.lathe(x - s * 0.44, 1.25, z, [[0.14, 0], [0.2, 0.18], [0.08, 0.36], [0, 0.62]], 5, 0.3);
    // six pennants streaming down-gorge
    const step = Math.min(1.45, (len - 2.6) / 6), ph0 = rng() * TAU;
    for (let j = 0; j < 6; j++) {
      const y = 2.3 + j * step, c = jew[order[(j + k) % 5]], fl = 0.95, hh = 0.36, ph = ph0 + j * 1.3, zz = z + 0.02;
      const pt = (u, v) => [x + 0.08 + u * fl, y + v * hh * (1 - u), zz + u * 0.2];
      G.thing(true);      // the pennant's five triangles are one thing for the mirror
      for (let q = 0; q < 3; q++) { const u0 = q / 3, u1 = (q + 1) / 3;
        S({ tile: -2, kind: 5, pivot: [1, 0, 0, ph], tint: c });      // laid by columns for the mirror (JEWEL_VERT, 6e)
        const put = (u, v) => { st.param = u; st.pivot[1] = v; G.v(pt(u, v), [0, 0, 1], u * 0.5, v * 0.2 + 0.2); };
        if (q < 2) { put(u0, -1); put(u1, -1); put(u1, 1); put(u0, -1); put(u1, 1); put(u0, 1); } else { put(u0, -1); put(1, 0); put(u0, 1); } }
      G.thing(false);
    }
    if (s > 0 && k % 8 === 7) yield;
  }
}

// ------------------------------------------------------------------------------------------------
// Assembly
// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('chamak-road-hero');
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const cast = ['mixed', 'warm', 'cool'].includes(opts.convoy) ? opts.convoy : rng.pick(['mixed', 'mixed', 'mixed', 'warm', 'cool']);
  const theme = rng.pick(['mixed', 'mixed', 'peacock', 'fish', 'eye']);
  const nTrucks = Math.max(1, Math.min(60, opts.trucks || 40));
  const parked = Array.isArray(opts.parked) ? opts.parked : [], nAll = nTrucks + parked.length;
  const own = !opts.beam;
  const object = new THREE.Group(); object.name = 'chamak-road-hero';
  const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
  const deg = (d) => Math.cos((d * Math.PI) / 180);
  const B = opts.beam || {};
  const U = {
    uEye: B.uEye || { value: new THREE.Vector3(0, 3, 260) },
    uBeamPos: B.uBeamPos || { value: [new THREE.Vector3(-1, 1.6, 260), new THREE.Vector3(1, 1.6, 260)] },
    uBeamDir: B.uBeamDir || { value: new THREE.Vector3(0, 0, -1) },
    uBeamGain: B.uBeamGain || { value: 1 },
    uBeamLong: B.uBeamLong || { value: new THREE.Vector4(deg(23), deg(8), 110, 150) },
    uBeamFlood: B.uBeamFlood || { value: new THREE.Vector4(deg(72), deg(48), 38, 0.75) },
    uSkyFill: { value: lin(pal[0], 1.6).add(new THREE.Vector3(0.002, 0.003, 0.006)) },
    uSkyTop: { value: lin(pal[0], 1.0) }, uSkyLow: { value: lin('#1B2350', 1.0) },
    uGlowCol: { value: lin(pal[1], 0.5) }, uGlowDir: { value: new THREE.Vector3(-0.57, 0.06, -0.82).normalize() },
    uTime: { value: 0 }, uConvoy: { value: 0 }, uPix: { value: 0.001 }, uEyeL: { value: new THREE.Vector3(0, 3, 260) },
    uFan: { value: new THREE.Vector2(70, 14) }, uTapeGain: { value: 2.4 }, uArch: { value: 0 }, uNrm: { value: new THREE.Matrix3() },
    uMirrorK: { value: 1 }, uWetK: { value: 1 }, uSnowK: { value: 0 }, uDryK: { value: 0 }, uMirFade: { value: 0 },
    // the exit portal as the wet deck mirrors it (world space: centre and radius, the way it faces, its light). Off (black) unless the world sets it
    uPortalPos: { value: new THREE.Vector4(0, 3, -HALF, 7) }, uPortalN: { value: new THREE.Vector3(0, 0, 1) }, uPortalCol: { value: new THREE.Vector3(0, 0, 0) },
  };
  U.uEyeW = U.uEye;
  const tex = await makeAtlas(ctx, pal, cast);
  const mats = makeMaterials(U, tex, !!opts.world);
  await ctx.yield();

  // ---- trucks ----
  const GT = makeAcc(); for (const _ of buildTruck(GT, rng.fork('truck'), pal)) await ctx.yield();
  // an accumulator's conversion to typed arrays, one attribute at a time with the page handed back in between
  const geoOf = async (G, el) => { const it = G.geometrySteps(el); let r; await ctx.yield(); while (!(r = it.next()).done) await ctx.yield(); return r.value; };
  const truckGeo = await geoOf(GT);
  await ctx.yield();
  const GS = makeAcc(); buildTruckShell(GS); const shellGeo = GS.geometry();
  await ctx.yield();
  const tA = new Float32Array(nAll * 4), tB = new Float32Array(nAll * 4), tI = new Float32Array(nAll * 4), tC = new Float32Array(nAll * 3);
  const pick = (k) => k[0] + rng.int(0, k[1] - 1);
  const bodies = { mixed: [pal[2], pal[3], pal[5], pal[4], '#101526', pal[2], pal[5]], warm: [pal[2], pal[4], pal[2], '#2a0b10', pal[3]], cool: [pal[5], pal[3], pal[5], '#0b1430', pal[4]] }[cast];
  const tr = rng.fork('convoy');
  for (let k = 0; k < nAll; k++) {
    const fav = theme === 'peacock' ? T.peacock : theme === 'fish' ? T.fish : theme === 'eye' ? T.eye : null;
    const any = () => tr.pick([T.flower, T.flower, T.sun, T.bird, T.cypress, T.fish, T.peacock, T.heart]);
    const p2 = (k2) => k2[0] + tr.int(0, k2[1] - 1);
    tA[k * 4] = p2(fav && tr.chance(0.6) ? fav : T.fish); tA[k * 4 + 1] = p2(tr.pick([T.flower, T.flower, T.bird, T.cypress, T.sun]));
    tA[k * 4 + 2] = p2(T.eye); tA[k * 4 + 3] = p2(fav && tr.chance(0.5) ? fav : tr.pick([T.peacock, T.peacock, T.sun, T.flower]));
    tB[k * 4] = p2(tr.pick([T.sun, T.flower, T.heart, T.eye])); tB[k * 4 + 1] = p2(any());
    tB[k * 4 + 2] = 58 + tr.int(0, 5); tB[k * 4 + 3] = p2(tr.pick([T.flower, T.heart, T.sun]));
    tI[k * 4] = tr() * 40; tI[k * 4 + 1] = tr.range(0.82, 1.2); tr(); tI[k * 4 + 2] = k < nTrucks ? 0 : 1; tI[k * 4 + 3] = tr();
    const c = new THREE.Color(tr.pick(bodies)), v = tr.range(0.5, 0.85); tC[k * 3] = c.r * v + 0.004; tC[k * 3 + 1] = c.g * v + 0.004; tC[k * 3 + 2] = c.b * v + 0.006;
  }
  void pick;
  const iA = new THREE.InstancedBufferAttribute(tA, 4), iB = new THREE.InstancedBufferAttribute(tB, 4), iI = new THREE.InstancedBufferAttribute(tI, 4), iC = new THREE.InstancedBufferAttribute(tC, 3);
  for (const g of [truckGeo, shellGeo]) { g.setAttribute('aTilesA', iA); g.setAttribute('aTilesB', iB); g.setAttribute('aInst', iI); g.setAttribute('aBody', iC); }
  const trucks = new THREE.InstancedMesh(truckGeo, mats.truck, nAll); trucks.frustumCulled = false; trucks.name = 'convoy';
  const shells = new THREE.InstancedMesh(shellGeo, mats.truckMirror, nAll); shells.frustumCulled = false; shells.instanceMatrix = trucks.instanceMatrix; shells.renderOrder = 3;
  object.add(trucks, shells);

  // ---- bridge ----
  // three meshes (far tower, near tower, span) so that no single conversion to typed arrays holds the page for long
  const farSeed = Math.floor(rng() * 1e9);
  const addPart = async (G, name) => { const m = new THREE.Mesh(await geoOf(G), mats.jewel); m.frustumCulled = false; m.name = name; object.add(m); await ctx.yield(); };
  const GF = makeAcc(); for (const _ of buildTower(GF, pal, ctx.core.makeRng(farSeed), -HALF, true)) await ctx.yield();
  await addPart(GF, 'bridge-far-tower');
  const GN = makeAcc(); for (const _ of buildTower(GN, pal, rng.fork('near'), HALF, false)) await ctx.yield();
  await addPart(GN, 'bridge-near-tower');
  const GB = makeAcc(); for (const _ of buildSpan(GB, pal, rng.fork('span'))) await ctx.yield();
  await addPart(GB, 'bridge');
  const GH = makeAcc(); for (const _ of buildHangers(GH, pal, rng.fork('hangers'))) await ctx.yield();
  const hangGeo = await geoOf(GH, true); await ctx.yield();
  const hangers = new THREE.Mesh(hangGeo, mats.jewel); hangers.frustumCulled = false; object.add(hangers);
  const hangMirror = new THREE.Mesh(hangGeo, mats.mirror); hangMirror.frustumCulled = false; hangMirror.renderOrder = 3; object.add(hangMirror);
  // 6g: a tower face is laid piece by piece for the mirror (each voussoir, ray and panel its own element, drawn out as its own streak): named
  // one thing (6b) the whole face was drawn out as a stretched picture of itself and lay on the deck as an upside-down arch
  const GM = makeAcc(); GM.at(0, 0, -HALF, 0); for (const _ of towerFace(GM, pal, ctx.core.makeRng(farSeed), true, true)) await ctx.yield();
  GM.pop(); await ctx.yield();
  GM.at(0, 0, HALF, Math.PI); for (const _ of towerFace(GM, pal, rng.fork('nm'), false, true)) await ctx.yield();
  GM.pop(); await ctx.yield();
  // the rails' inner faces (kerb checks and mosaic field, laid as buildSpan lays them), for the deck's mirror only: they follow the
  // two tower faces in the one buffer, so the mirror of the rails costs no draw
  { const SR = (o) => GM.set(Object.assign({ tile: -1, gate: 0, kind: 0, param: 0, pivot: [0, 0, 0, 0], tint: [0.925, 0.925, 0.925] }, o));
    const LR = HALF + 14, fields = [T.diamonds, T.chevrons, T.scallops, T.stripes, T.diamonds, T.checks];
    for (const s of [-1, 1]) {
      for (let k = -22; k < 22; k++) {
        const z0 = Math.max(-LR, k * 10), z1 = Math.min(LR, k * 10 + 10), n = (z1 - z0) / 1.25;
        const inner = (x, y0, y1, r) => { if (s > 0) GM.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], r); else GM.quad([-x, y0, z1], [-x, y0, z0], [-x, y1, z0], [-x, y1, z1], r); };
        SR({ tile: T.checks }); inner(5.62, 0, 0.26, [0, 0, n, 0.5]);
        SR({ tile: fields[((k + 44) * 7 + (s > 0 ? 0 : 3)) % 6] }); inner(5.8, 0.3, 1.25, [0, 0.02, n, 0.98]);
      }
      await ctx.yield();
    } }
  const archGeo = await geoOf(GM, true); await ctx.yield();
  const archMirror = new THREE.Mesh(archGeo, mats.mirror); archMirror.frustumCulled = false; archMirror.renderOrder = 3; object.add(archMirror);
  const roadGeo = new THREE.PlaneGeometry(11.24, 2 * (HALF + 14), 2, 44); roadGeo.rotateX(-Math.PI / 2);
  const road = new THREE.Mesh(roadGeo, mats.road); road.frustumCulled = false; road.name = 'wet-deck'; object.add(road);
  await ctx.yield();

  // ---- convoy placement ----
  const bendR = 130 - LANE_X, bendC = new THREE.Vector3(130, 0, HALF), bendMax = (35 * Math.PI) / 180;
  const laneOut = { x: LANE_X, y: 0, z: 0, heading: 0 };      // one reused record: placeConvoy allocates nothing
  const defaultLane = (d, out) => {
    if (d <= 0) { out.x = LANE_X; out.y = 0; out.z = HALF + d; out.heading = 0; return out; }
    const phi = Math.min(d / bendR, bendMax), over = d - phi * bendR;
    out.x = bendC.x - bendR * Math.cos(phi) + Math.sin(phi) * over; out.y = 0; out.z = bendC.z + bendR * Math.sin(phi) + Math.cos(phi) * over; out.heading = phi;
    return out;
  };
  const laneAt = typeof opts.laneAt === 'function' ? opts.laneAt : defaultLane;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  let travel = null, archManual = null;
  const placeConvoy = (time) => {
    const loop = nTrucks * 13;
    for (let k = 0; k < nTrucks; k++) {
      let d, sc = 1;
      if (travel !== null) d = 390 - (398.6 + 13 * k - (6 / 21) * travel);
      else { let z = ((13 * k + 6 * time) % loop + loop) % loop - loop / 2; d = z - HALF; sc = 1 - ctx.core.smoothstep(HALF + 3, HALF + 9, Math.abs(z)); }
      let L = laneOut;
      if (travel !== null) { L = laneAt(d, laneOut) || laneOut; if (L.z < 0) sc = 1 - ctx.core.smoothstep(HALF + 3, HALF + 9, -L.z); }      // not yet out of the far arch: not drawn
      else { L.x = LANE_X; L.y = 0; L.z = HALF + d; L.heading = 0; }
      p3.set(L.x, L.y || 0, L.z); q4.setFromAxisAngle(yAxis, L.heading || 0); s3.set(sc, sc, sc);
      m4.compose(p3, q4, s3); trucks.setMatrixAt(k, m4);
    }
    trucks.instanceMatrix.needsUpdate = true;
    U.uConvoy.value = travel !== null ? (6 / 21) * travel : 6 * time;
  };
  for (let k = 0; k < parked.length; k++) {      // parked trucks: fixed, wheels still (aInst.z = 1)
    const L = parked[k]; p3.set(L.x, L.y || 0, L.z); q4.setFromAxisAngle(yAxis, L.heading || 0); s3.set(1, 1, 1); m4.compose(p3, q4, s3); trucks.setMatrixAt(nTrucks + k, m4);
  }
  placeConvoy(0);

  // ---- framing hints (opts.view: mid | arch | near | whole | drive | approach) ----
  const hv = typeof opts.view === 'string' ? opts.view : 'whole';
  const frames = {
    whole: { radius: 290, height: 50, center: new THREE.Vector3(0, 12, 0) },
    mid: { radius: 20, height: 12, center: new THREE.Vector3(1.5, 4, 10) },
    arch: { radius: 30, height: 26, center: new THREE.Vector3(0, 13, -HALF + 6) },
    near: { radius: 7, height: 6, center: new THREE.Vector3(2.6, 4, 0) },
    // the two below put the viewer's u = 0.1 frame on the free lane at eye height, lit by the brief's true headlights
    drive: { radius: 7, height: 2.6, center: new THREE.Vector3(-4.4, 2, 0) },
    approach: { radius: 15, height: 2.6, center: new THREE.Vector3(-7.3, 2, -HALF + 18) },
  };
  const frame = frames[hv] || frames.whole, trueBeam = hv === 'drive' || hv === 'approach';

  const inv = new THREE.Matrix4(), eyeW = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), size = new THREE.Vector2();
  const glowLocal = new THREE.Vector3(-Math.sin(bendMax), 0.07, -Math.cos(bendMax)).normalize(), farArch = new THREE.Vector3(0, 3, -HALF);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const hero = {
    object, radius: frame.radius, height: frame.height, center: frame.center,
    span: { length: 2 * HALF, deckWidth: 2 * DECK_W, towerHeight: TOWER_H, radius: 290, height: 50 },
    ground: false, groundY: -90,
    uniforms: U, cast, theme, kit: { mats, tex, makeAcc, T, GLSL_BEAM },
    anchors: {
      portalSeat: { position: V(0, 3, -HALF), facing: V(0, 0, 1), radius: 7 },
      flyThrough: [V(0, 3, HALF + 60), V(0, 3, HALF), V(0, 3, 100), V(0, 3, 0), V(0, 3, -100), V(0, 3, -180), V(0, 3, -HALF)],
      nearArch: V(0, ARCH_Y, HALF), farArch: V(0, ARCH_Y, -HALF), entry: V(0, 0, HALF + 14),
      bend: { centre: bendC.clone(), radius: 130, sweep: bendMax },
      viewpoints: { reveal: { position: V(23.5, 3, 279.6), target: V(0, 10, 100) }, midspan: { position: V(0, 3, 0), target: V(2.5, 4, -80) }, approach: { position: V(0, 3, -120), target: V(0, 5, -HALF) } },
      truckLane: { x: LANE_X, from: V(LANE_X, 0, -HALF), to: V(LANE_X, 0, HALF) },
      owlPerch: V(-CABLE_X, 12, 80), river: V(0, -90, 0),
    },
    setTravel(s) { travel = s; },
    setProgress(u) { travel = u * 800; },
    setArch(a) { archManual = a; },
    update(dt, time, camera) {
      object.updateMatrixWorld(); inv.copy(object.matrixWorld).invert(); U.uNrm.value.setFromMatrix4(object.matrixWorld);
      U.uTime.value = time;
      if (own && camera) {
        eyeW.setFromMatrixPosition(camera.matrixWorld); camera.getWorldDirection(fwd);
        right.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
        U.uEye.value.copy(eyeW); U.uBeamDir.value.copy(fwd);
        U.uBeamPos.value[0].copy(eyeW).addScaledVector(right, -1).addScaledVector(up, -1.4);
        U.uBeamPos.value[1].copy(eyeW).addScaledVector(right, 1).addScaledVector(up, -1.4);
        // showcase torch: wide, and long enough to reach the piece from wherever the viewer orbits
        p3.copy(eyeW).applyMatrix4(inv); const dz = Math.max(0, Math.abs(p3.z) - HALF), dist = Math.hypot(p3.x, p3.y, dz);
        const full = Math.max(120, dist * 1.25 + 70);
        if (!trueBeam) {
          U.uBeamLong.value.set(deg(50), deg(22), full, full * 1.7 + 40); U.uBeamFlood.value.set(deg(82), deg(55), 70, 0.7);
          U.uFan.value.set(Math.max(70, dist * 1.3 + 30), Math.max(14, dist * 0.75));
        }
        if (!opts.afterglowDir) U.uGlowDir.value.copy(glowLocal).transformDirection(object.matrixWorld);
      } else if (!opts.afterglowDir) U.uGlowDir.value.copy(glowLocal).transformDirection(object.matrixWorld);
      if (opts.afterglowDir) U.uGlowDir.value.copy(opts.afterglowDir).normalize();
      U.uEyeL.value.copy(U.uEye.value).applyMatrix4(inv);
      if (camera) { ctx.renderer.getDrawingBufferSize(size); U.uPix.value = (0.85 * 2) / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1)); }
      if (archManual !== null) U.uArch.value = archManual;
      else if (own && !trueBeam) U.uArch.value = ctx.core.clamp(0.62 + 0.6 * Math.sin(time * 0.25 + 3.6), 0, 1);
      else U.uArch.value = 1 - ctx.core.smoothstep(25, 150, U.uEyeL.value.distanceTo(farArch));
      placeConvoy(time);
    },
    dispose() { tex.texA.dispose(); tex.texB.dispose(); },
  };
  return hero;
}

export { makeAcc, T as TILES, GLSL_BEAM };
