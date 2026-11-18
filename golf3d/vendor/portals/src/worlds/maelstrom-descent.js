// THE DESCENT (maelstrom-descent): a sailing boat is carried over the rim of a 600 m whirlpool and rides its glass
// wall round and down into the throat. Hero set piece: src/parts/maelstrom-descent.js (sea + funnel, one mesh).
// FLOCK CURE (10 and 13 Oct): the gulls keep 2.3 m from the flown line by place: maxSigma 3, the gulls' own wander, keepClear on the three wheeling flocks and the lifting gulls (the line walked every 4 m, only along the stretch each flock can come near; the loops baked at 64 samples), each made by the kit's stepped maker (makeFlockAsync with ctx.yield). The crossing eagle has no keepClear: its place is a function of the flight's u alone, and with its lead 10 -> 15 its body stays over 2.0 m from the lens at every u (its course itself passes nearer the line than that).
//
// MAP OF THIS FILE (in order)
//   1  helpers + Soup            triangle-soup builder (flat quads, smooth lofts, tubes, boxes) with colour + aFx
//   2  model builders            hullInto (clinker hull, ribs, thwarts, posts; `lapped` = banded strakes with smooth
//                                normals for hulls seen from above), boatGeo (leader / second boat), rowboatGeo,
//                                keelUp + wreckGeo (dismasted hull | upturned whaleboat | raft of fish racks),
//                                skiffGeo, barrelGeo, yardGeo (a cocked spar with a standing rag of sailcloth), floatsGeo, mastGeo, fishGeo, sealGeo, swimmerGeo
//                                (seal | porpoise), kelpGeo, raftGeo (olive weed mat, gold-edged pointed fronds), oarGeo
//   3  propMaterial              ONE lit shader for everything this file builds. It shares hero.uniforms (sun,
//                                ambient, sky, uCam, uTime) and the hero's sunLit() so props take the rim's shadow.
//                                uWig = vertex wiggle (fish tails, kelp, sails), uUnder = in-water tint, uSeal = shoal
//                                scatter, aFx.y = thin-line widening, aFx.z = height above the waterline (a thin foam
//                                line there; below it the hull takes the water's colour; aFx.z >= 10 on a cloth material =
//                                sailcloth: seams, belly shading). matRaft (wet 0) = the kelp rafts: no waterline collar on weed.
//                                Instanced things under the water (fish, kelp) draw in to nothing between 34 and 60 m
//                                (the shoal between 22 and 38 m, and wherever the eye sees a fish flatter than ~14
//                                degrees to the wall: there it lay on the glass as a paper cut-out). The ring lights
//                                whatever rides near it (uSeat). On the glass the hull under the waterline takes the
//                                glow of the water it sits in (dark, it showed through the wall as a grey slab).
//                                Nothing is pure black: timber keeps a dark brown floor (lighter on faces turned to
//                                the sky), fish and kelp in the glass a dark green one (the grade crushes anything under ~0.06).
//                                SHELF_VS / SHELF_FS = the storm shelf (own sky layer, see 5d); BAR_VS / BAR_FS = six
//                                bars of stratocumulus across the sun's quarter, fog weather only (its sky was flat beige)
//   4  HOURS / WEATHERS / CASTS  the seeded moods: light, sky, fog, palette, cast. Search "SEEDED MOODS". The squall
//                                has two kinds (slate with a low gold slot | iron with a cold pale band): "squall kind".
//                                'clear' is broken storm cloud over the sun's gold quarter; 'fog' is sea smoke on the race
//                                under the same storm sky (thick only until we tip over the rim).
//   5  build(ctx)
//        5a choices              weather = first ctx.rng draw (clear | squall | fog), cast, hour from ctx.vary.hour
//        5b hero                 buildHero(...) at the world origin, unrotated (axis = origin, sea level y 0)
//        5c PATH                 makeRoute(): run-in 100 m heading compass 35, crest of the west breaker, slide
//                                r 300 -> 185 (carried up to 5.5 m high through its first half: the eye sees over the
//                                brow of the wall into the pit), wall r 185 -> 78 (0.95 turn), turn-in lifted 9 - 14.5 m so the ring
//                                shows over the lip, 62 m plunge at 65 degrees to
//                                hero.anchors.portalSeat. polarAt(u) = camera (r, theta) table used by every staged pass.
//        5d sky, fog, light rig, the storm shelf (a spiral sheet of cloud 520 m up, turning with the water, an eye
//           over the throat, open toward the sun), cumulus towers round the horizon (kit cloud field), islands, rain
//           curtains                                               (fog + exposure + grade: search "POST")
//        5e boats                leader (rides OUR path ahead of us: gapAt(u); 15 m further down the wall from u 0.11
//                                to 0.38, clear of the sight line into the pit; 9 m up the wall round u 0.42 so a
//                                hull-length of water lies between it and the wreck), THE SECOND BOAT = THE CLOSE PASS
//                                (search "b2Ahead": high on the wall on the way in, then from u 0.5 to 0.66 heeling on
//                                the slope 9.5 m up the wall to port, 21 m ahead closing to 5: dark hull, tan sail,
//                                seen from its quarter above the shoal), THE THIRD BOAT ON THE LIP (placeBoat3: u 0.66
//                                - 0.84, going round the lip of the throat left of the ring; the lip takes it at
//                                u 0.8), three rowing boats + oars. The second boat loses way from u 0.6 and is
//                                abeam, out of the frame, by u 0.65 (its gaze poi keeps the course it held before)
//        5f wreckage             orbiters[]: wreck (met at u 0.43: 9.5 m ahead, 6.8 m to starboard, drifting inward with us
//                                so the gap holds; see addOrb / orbR), skiff 0.31, THE PASS AT u 0.52 (the yard and three
//                                barrels at true scale, 0.85 m, 13 - 23 m off the starboard bow from u 0.49 to 0.55,
//                                each with a wake: search "U_YARD"), five more barrels 0.49-0.61, floats 0.585,
//                                THE LIP PASS (placeLipWreck, LIPW: a keel-up hull, a yard and two barrels 8 - 19 m
//                                off the starboard bow from u 0.80, sliding to the brow and over it by u 0.92)
//        5g the glass            cod / saithe shoal (every third fish big and near: 0.9 - 2.2 m under the surface, up the
//                                wall to port of the track, inside the frame; hero.setClearB opens a window of clear
//                                glass over them, where they hang dark against the lit wall), herring ball, the seal posed for the
//                                eye (sealPoint / placeSwimmers: in profile, chest toward us, with a window in the
//                                foam over it and lit water behind it; calmK moves it ahead and under the track for
//                                the steady camera) or two porpoises rolling at the surface 8 m ahead (slate backs,
//                                fins out every 3.7 s), kelp fronds (u 0.53 - 0.68)
//        5h birds                three gull flocks wheeling with the water, eagles, the eagle crossing at u 0.34
//        5i rafts (kept off the run-in line), spray, puffs, the rare mast, mistbow (day)       (puff index map: search "puffs: 0-9")
//        5j POIS + return        pois (the far lip of the pit twice over u 0.08-0.36: the whirlpool held in the middle of
//                                the frame on the slide; far wall, wreck, glass, seal, portal twice, yard, the second boat
//                                u 0.49-0.665, leader u 0.64-0.75), the ring's glow in the throat, entry
//                                apron (lit water under the run-in for the view through the previous world's portal),
//                                portal, post. Build yields (ctx.yield) between every piece.
//        5k update()             everything keyed to u: leader gap, orbit phases, seal pass, mist (hero.setMist),
//                                dive veil (fog ramp), the rare cough (ctx.vary.rare: mast shot from the throat, u 0.50-0.60)
//
// UNIFORMS THAT DRIVE THE SCRIPTED MOMENTS
//   hero.setMist(m, c)     collar + wisps: thinned from u 0.62-0.70 on so the portal reads, collapses at u 0.49 on the rare cough;
//                          c = the collar alone, down to 0.4 over u 0.12-0.38 while we look into the pit
//   hero.setClearB(p, r)   the window over the shoal, 11 m ahead and 4.5 m to port, radius 20 m, from u 0.47 while we
//                          run along the glass
//   hero.setKeep(p, r)     u < 0.17: no spindrift on the sight line to the leader as we come over the crest
//   hero.setSeat(p, k)     the ring's light in the hero's own shaders: a gold halo scattered by the mist on the sight
//                          line, a warm wash and glints on the shaft wall. k follows the glow, x emberK (1.2 - 1.7 under
//                          squall, fog, dawn and day, where the mist is pale; more and the throat went khaki), eased back to 1 by u 0.9
//                          (under fog by u 0.86)
//   hero.setWake(i, ...)   0 our bow (astern of the eye, no contact patch), 1 leader, 2 wreck until u 0.64 then the
//                          third boat, 3 second boat (until u 0.75),
//                          4-6 rowing boats until u 0.34, then the yard and two barrels (from u 0.36 to 0.74), 7 skiff
//                          until u 0.4, then the third barrel (from u 0.42). From u 0.775 slots 3 - 6 are the lip
//                          pass: hull, yard, two barrels. Strength over 1 = a churned white core.
//   hero.setPour(k)        white water pouring over the brow of the lip (u 0.8 - 0.935, full from 0.85 to 0.9)
//   hero.setPit(k)         the mist in the throat thinned and turned black-green for the lip pass (u 0.78 - 0.94; full
//                          under fog, 0.7 under the squall, 0.45 clear), so the ring is the one bright thing in it
//   hero.uniforms.uBrkK    froth threads on the breaker's back: 0.5 under the squall
//   puffs 0 - 9            the bow bursts on the slide (u < 0.5), then spray torn off the brow where the wreckage
//                          goes over (u 0.8 - 0.94)
//   shelfU.uShelf          the storm shelf: x amount, y haze length, z turn (follows the clock), w arm spacing
//   hero.uniforms.uShade   cloud shadows crossing the walls (clear) or the squall's one slot of sun
//   sealMat.uSeal          the swimmer's position: the shoal parts round it
//   hero.setClear(p, r)    a window in the foam layers where the sight line to the seal crosses the surface
//   sealLight              fx.makeGlow behind the seal: lit water for it to hang against (intensity 0 when it is away)
//   scene.fog.density      base haze (fog weather: thick for u < 0.14, thinning to u 0.3) + the short veil at
//                          u 0.92-0.96 as we go over the lip
//   glowDeep / glowHigh    fx.makeGlow sprites: one wrapped round the ring (drawn after the mist, no fog, 44 m until u 0.84
//                          then 26 m), a faint one 6 m up the dive line (one light, not two), faded in over u 0.60-0.68
//   portal                 engine ring, halo: false (the engine's halo disc is cut by the shaft wall)
//   propMaterial uLk       per-material sky fill, rim-light gain and back-light lobe (the wreck: dark, gold-edged;
//                          matKeel for the keel-up hulls: no broad lobe, they face the sky)
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import { buildHero, MAELSTROM_GLSL } from '../parts/maelstrom-descent.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180, DUR = 46;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const bell = (x, a, b, f) => sstep(a, a + f, x) * (1 - sstep(b - f, b, x));
const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixC = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const DRY = [0, 0, 9];       // aFx for things with no wiggle and no waterline

// ---------------------------------------------------------------- 1. Soup
const _a = V3(), _b = V3(), _c = V3();
class Soup {
  constructor() { this.p = []; this.n = []; this.c = []; this.f = []; }
  get tris() { return this.p.length / 9; }
  vert(p, n, col, fx) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.c.push(col[0], col[1], col[2]); this.f.push(fx[0], fx[1], fx[2]); }
  // flat triangle / quad; `out` (optional) = a direction the face should look toward
  tri(a, b, c, col, fx = DRY, out = null) {
    const n = V3().subVectors(b, a).cross(_a.subVectors(c, a));
    if (n.lengthSq() < 1e-14) return; n.normalize();
    if (out && n.dot(out) < 0) { n.negate(); const t = b; b = c; c = t; }
    this.vert(a, n, col, typeof fx === 'function' ? fx(a) : fx); this.vert(b, n, col, typeof fx === 'function' ? fx(b) : fx); this.vert(c, n, col, typeof fx === 'function' ? fx(c) : fx);
  }
  quad(a, b, c, d, col, fx = DRY, out = null) { this.tri(a, b, c, col, fx, out); this.tri(a, c, d, col, fx, out); }
  // smooth loft through rings (arrays of Vector3 with equal counts). col / fx may be functions of (i, j, point).
  loft(rings, col, fx = DRY, o = {}) {
    const nR = rings.length, nS = rings[0].length, closed = o.closed !== false, flip = o.flip ? -1 : 1;
    const cen = rings.map((r) => { const c = V3(); for (const p of r) c.add(p); return c.multiplyScalar(1 / nS); });
    const N = rings.map((ring, i) => ring.map((p, j) => {
      const a = ring[closed ? (j + 1) % nS : Math.min(nS - 1, j + 1)], b = ring[closed ? (j + nS - 1) % nS : Math.max(0, j - 1)];
      const u = rings[Math.min(nR - 1, i + 1)][j], d = rings[Math.max(0, i - 1)][j];
      const n = V3().subVectors(a, b).cross(_a.subVectors(u, d));
      if (n.lengthSq() < 1e-12) n.subVectors(p, cen[i]);
      if (n.lengthSq() < 1e-12) n.set(0, 1, 0);
      n.normalize();
      if (closed) { if (n.dot(_a.subVectors(p, cen[i])) < 0) n.negate(); } else n.multiplyScalar(flip);
      return n;
    }));
    const cf = typeof col === 'function' ? col : () => col, ff = typeof fx === 'function' ? fx : () => fx;
    const put = (i, j) => this.vert(rings[i][j], N[i][j], cf(i, j, rings[i][j]), ff(i, j, rings[i][j]));
    const jn = closed ? nS : nS - 1;
    for (let i = 0; i < nR - 1; i++) for (let j = 0; j < jn; j++) {
      const k = (j + 1) % nS;
      put(i, j); put(i + 1, j); put(i + 1, k); put(i, j); put(i + 1, k); put(i, k);
    }
    if (closed && o.cap !== false) for (const e of [0, nR - 1]) {
      const ax = V3().subVectors(cen[e], cen[e === 0 ? 1 : nR - 2]).normalize();
      for (let j = 0; j < nS; j++) { const k = (j + 1) % nS; this.vert(cen[e], ax, cf(e, j, cen[e]), ff(e, j, cen[e])); this.vert(rings[e][j], ax, cf(e, j, rings[e][j]), ff(e, j, rings[e][j])); this.vert(rings[e][k], ax, cf(e, k, rings[e][k]), ff(e, k, rings[e][k])); }
    }
    return this;
  }
  // tube along a polyline: radius number | fn(t), sides, optional squash [sy, sz]
  tube(pts, radius, sides, col, fx = DRY, o = {}) {
    const rings = [], n = pts.length, up = o.up || V3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), tg = V3().subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      const s = V3().crossVectors(tg, Math.abs(tg.dot(up)) > 0.95 ? _b.set(1, 0, 0) : up).normalize(), w = V3().crossVectors(s, tg);
      const r = typeof radius === 'function' ? radius(t) : radius, ring = [];
      for (let j = 0; j < sides; j++) { const a = (j / sides) * TAU + (o.phase || 0); ring.push(pts[i].clone().addScaledVector(s, Math.cos(a) * r * (o.sx || 1)).addScaledVector(w, Math.sin(a) * r * (o.sy || 1))); }
      rings.push(ring);
    }
    return this.loft(rings, col, fx, o);
  }
  // box from centre, half sizes and optional basis vectors
  box(c, hx, hy, hz, col, fx = DRY, X = V3(1, 0, 0), Y = V3(0, 1, 0), Z = V3(0, 0, 1)) {
    const P = (sx, sy, sz) => c.clone().addScaledVector(X, sx * hx).addScaledVector(Y, sy * hy).addScaledVector(Z, sz * hz);
    const q = (a, b, cc, d, o) => this.quad(a, b, cc, d, col, fx, o);
    q(P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), Y); q(P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), _c.copy(Y).negate().clone());
    q(P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), X); q(P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), X.clone().negate());
    q(P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), Z); q(P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), P(1, -1, -1), Z.clone().negate());
    return this;
  }
  // an existing BufferGeometry (with normals), painted by functions of position / normal
  geo(g, m4, colFn, fxFn = () => DRY) {
    const src = g.index ? g.toNonIndexed() : g, P = src.attributes.position, Nn = src.attributes.normal, nm = new THREE.Matrix3().getNormalMatrix(m4);
    for (let i = 0; i < P.count; i++) {
      const lp = V3().fromBufferAttribute(P, i), ln = V3().fromBufferAttribute(Nn, i);
      const col = colFn(lp, ln), f = fxFn(lp, ln);
      this.vert(lp.clone().applyMatrix4(m4), ln.clone().applyMatrix3(nm).normalize(), col, f);
    }
    if (src !== g) src.dispose();
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute('aFx', new THREE.BufferAttribute(new Float32Array(this.f), 3));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- 2. model builders
// Local space of every floating thing: +X forward (bow), +Y up, +Z starboard, y 0 = the waterline.
const TAR = C('#7A5E44'), TAR2 = C('#8C7052'), WOOD = C('#8E7250'), PALE = C('#B09870'), TAN = C('#B8864C'), ROPE = C('#7A6A4C');
const wl = (a, b, c) => [0, 0, (c || a).y];    // aFx from the waterline height; works as tri fx (point) and loft fx (i, j, point)

// Clinker hull, double-ended, with tall stem and stern posts. o: L, B (half beam), D (draught), F (freeboard),
// rise (sheer at the ends), strakes, stations, skip(i, j, side) -> true to leave a plank out, ribsUp(i, side) extra m
function hullInto(S, o) {
  const { L, B, D, F: FB, rise } = o, nS = o.strakes || 7, N = o.stations || 22, skip = o.skip || (() => false), fxOf = o.fx || wl;
  const sec = (x) => { const t = Math.min(1, Math.abs(2 * x / L)); return { b: B * Math.pow(Math.max(1e-4, 1 - Math.pow(t, 2.3)), 0.55), yk: -D * (1 - Math.pow(t, 3.2)), ys: FB + rise * Math.pow(t, 2.6) }; };
  const pt = (x, s, side, inset = 0) => { const q = sec(x), w = Math.max(0, q.b * Math.pow(s, 0.6) - inset); return V3(x, q.yk + (q.ys - q.yk) * Math.pow(s, 1.25), side * w); };
  const X = (i) => -L / 2 + (L * i) / N;
  for (const side of [-1, 1]) {
    const out = V3(0, -0.25, side);
    for (let j = 0; j < nS; j++) {
      const s0 = Math.max(0.0, j / nS - 0.025), s1 = (j + 1) / nS, tone = 0.8 + 0.4 * hash(j * 7.3 + side * 3.1 + (o.seed || 0));
      if (o.lapped) {
        // a hull seen from above at arm's length (the keel-up wrecks): normals smooth along the length and hard across
        // the laps, and each strake in three bands: the worn land (its proud edge), the plank, the shadow under the next land
        const E0 = [], E1 = [], Nn = [];
        for (let i = 0; i <= N; i++) { const a = pt(X(i), s0, side), d = pt(X(i), s1, side); a.z += side * 0.06; E0.push(a); E1.push(d); }
        for (let i = 0; i <= N; i++) { const al = V3().subVectors(E1[Math.min(N, i + 1)], E1[Math.max(0, i - 1)]).add(_a.subVectors(E0[Math.min(N, i + 1)], E0[Math.max(0, i - 1)])), n = al.cross(_a.subVectors(E1[i], E0[i]));
          if (n.lengthSq() < 1e-12) n.copy(out); n.normalize(); if (n.dot(out) < 0) n.negate(); Nn.push(n); }
        const alt = (j % 2 ? 1.16 : 0.84) * (0.92 + 0.16 * hash(j * 7.3 + side * 3.1 + (o.seed || 0)));
        for (const [b0, b1, bt] of [[0, 0.15, 1.7], [0.15, 0.8, 1], [0.8, 1, 0.5]]) for (let i = 0; i < N; i++) {
          if (skip(i, j, side)) continue;
          const col = mul(j === nS - 1 ? TAR2 : TAR, alt * bt * (0.9 + 0.2 * hash(i * 3.7 + j * 11.1 + side)));
          const a = E0[i].clone().lerp(E1[i], b0), b = E0[i + 1].clone().lerp(E1[i + 1], b0), c = E0[i + 1].clone().lerp(E1[i + 1], b1), d = E0[i].clone().lerp(E1[i], b1);
          for (const [q, m] of [[a, i], [b, i + 1], [c, i + 1], [a, i], [c, i + 1], [d, i]]) S.vert(q, Nn[m], col, fxOf(q, q, q));
          // the land itself: the step from the proud edge back to the strake below (keel-up, it looks at the sky)
          if (b0 === 0 && j > 0) { const e = a.clone(), f = b.clone(); e.z -= side * 0.06; f.z -= side * 0.06; e.y += 0.012; f.y += 0.012; S.quad(e, f, b, a, mul(TAR2, 1.9 * alt), fxOf, V3(0, -1, 0)); }
        }
        continue;
      }
      for (let i = 0; i < N; i++) {
        if (skip(i, j, side)) continue;
        const col = mul(j === nS - 1 ? TAR2 : TAR, tone * (0.9 + 0.2 * hash(i * 3.7 + j * 11.1 + side)));
        const a = pt(X(i), s0, side), b = pt(X(i + 1), s0, side), c = pt(X(i + 1), s1, side), d = pt(X(i), s1, side);
        a.z += side * 0.04; b.z += side * 0.04;                    // the lap: each strake stands proud of the one below
        S.quad(a, b, c, d, col, fxOf, out);
      }
    }
    // ribs (frames) inside, every second station; ribsUp lets broken ones stand above the sheer
    for (let i = 2; i < N - 1; i += 2) {
      const x = X(i), up = o.ribsUp ? o.ribsUp(i, side) : 0, steps = 6, rw = o.ribW || 0.045, rd = rw + 0.065;
      for (let k = 0; k < steps; k++) {
        const s0 = 0.04 + (0.94 * k) / steps, s1 = 0.04 + (0.94 * (k + 1)) / steps;
        const a0 = pt(x - rw, s0, side, 0.02), a1 = pt(x + rw, s0, side, 0.02), b0 = pt(x - rw, s1, side, 0.02), b1 = pt(x + rw, s1, side, 0.02);
        const i0 = pt(x - rw, s0, side, rd), i1 = pt(x + rw, s0, side, rd), j0 = pt(x - rw, s1, side, rd), j1 = pt(x + rw, s1, side, rd);
        if (k === steps - 1 && up > 0) { for (const q of [b0, b1, j0, j1]) q.y += up; j0.z = b0.z - side * 0.09; j1.z = b1.z - side * 0.09; }
        const col = mul(WOOD, 0.75 + 0.3 * hash(i + k * 5.1));
        S.quad(i0, i1, j1, j0, col, fxOf, V3(0, 0.2, -side)); S.quad(a0, i0, j0, b0, col, fxOf, V3(-1, 0, 0)); S.quad(a1, b1, j1, i1, col, fxOf, V3(1, 0, 0));
        if (up > 0 || o.ribBacks) S.quad(a0, b0, b1, a1, mul(col, 0.7), fxOf, V3(0, 0, side));
        if (k === steps - 1 && up > 0) S.quad(b0, j0, j1, b1, mul(PALE, 1.1), fxOf, V3(0, 1, 0));   // the pale snapped end
      }
    }
    // gunwale
    if (!o.noRail) {
      const rings = [];
      for (let i = 0; i <= N; i++) { const p = pt(X(i), 1, side); if (skip(Math.min(i, N - 1), nS, side)) { if (rings.length > 1) S.loft(rings.splice(0), mul(WOOD, 0.8), fxOf); else rings.length = 0; continue; }
        rings.push([p.clone().add(_a.set(0, 0.05, side * 0.05)), p.clone().add(_a.set(0, 0.05, -side * 0.04)), p.clone().add(_a.set(0, -0.04, -side * 0.04)), p.clone().add(_a.set(0, -0.04, side * 0.05))]); }
      if (rings.length > 1) S.loft(rings, mul(WOOD, 0.8), fxOf);
    }
  }
  // keel and the two posts
  for (let i = 0; i < N; i++) {
    const a = pt(X(i), 0, 1), b = pt(X(i + 1), 0, 1), col = mul(TAR, 0.8);
    const k = (p, z, dy) => V3(p.x, p.y + dy, z);
    S.quad(k(a, 0.06, -0.16), k(b, 0.06, -0.16), k(b, 0.06, 0.02), k(a, 0.06, 0.02), col, fxOf, V3(0, 0, 1));
    S.quad(k(a, -0.06, -0.16), k(b, -0.06, -0.16), k(b, -0.06, 0.02), k(a, -0.06, 0.02), col, fxOf, V3(0, 0, -1));
    S.quad(k(a, -0.06, -0.16), k(b, -0.06, -0.16), k(b, 0.06, -0.16), k(a, 0.06, -0.16), col, fxOf, V3(0, -1, 0));
  }
  for (const e of [-1, 1]) {
    const top = FB + rise, h = o.post ?? 0.9, pts = [V3(e * (L / 2 - 0.9), -D * 0.35, 0), V3(e * (L / 2 - 0.25), 0.05, 0), V3(e * (L / 2 + 0.02), top * 0.6, 0), V3(e * (L / 2 + 0.16), top + h * 0.45, 0), V3(e * (L / 2 + 0.08), top + h, 0)];
    const cv = new THREE.CatmullRomCurve3(pts).getPoints(9);
    S.tube(cv, (t) => 0.1 * (1 - 0.45 * t), 4, mul(TAR2, 0.9), fxOf, { up: V3(0, 0, 1), sx: 1.5, phase: Math.PI / 4 });
  }
  return { sec, pt, X, N };
}

function thwarts(S, H, list, FB) {
  for (const x of list) { const q = H.sec(x), w = q.b * Math.pow(0.7, 0.6) - 0.05, y = q.yk + (q.ys - q.yk) * Math.pow(0.7, 1.25); S.box(V3(x, y, 0), 0.15, 0.025, w, mul(WOOD, 0.9), wl); }
}

// a seated figure in oilskins, facing `yaw` (0 = forward +X), ~0.95 m tall seated
function figureInto(S, at, yaw, seed, lookDown = 0.3) {
  const m = new THREE.Matrix4().makeRotationY(-yaw).setPosition(at), coat = mul(C(['#3B3A2C', '#2A3038', '#4A3A22', '#33312A'][seed % 4]), 0.9), skin = C('#B98A66');
  const ring = (y, rx, rz, fwd = 0) => { const r = []; for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU; r.push(V3(fwd + Math.cos(a) * rx, y, Math.sin(a) * rz).applyMatrix4(m)); } return r; };
  S.loft([ring(0.0, 0.2, 0.22), ring(0.22, 0.19, 0.21, 0.02), ring(0.45, 0.2, 0.24, 0.06), ring(0.6, 0.15, 0.2, 0.09), ring(0.68, 0.07, 0.07, 0.11)], coat, wl);
  const hc = V3(0.14 + 0.05 * lookDown, 0.8 - 0.03 * lookDown, 0);
  const hr = (dy, r) => { const o = []; for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU; o.push(V3(hc.x + Math.cos(a) * r, hc.y + dy, hc.z + Math.sin(a) * r * 0.9).applyMatrix4(m)); } return o; };
  S.loft([hr(-0.1, 0.05), hr(-0.05, 0.09), hr(0.02, 0.1), hr(0.08, 0.075)], skin, wl);
  S.loft([hr(0.05, 0.17), hr(0.08, 0.11), hr(0.15, 0.06)], mul(coat, 0.8), wl);     // sou'wester
  for (const sd of [-1, 1]) S.tube([V3(0.08, 0.58, sd * 0.2).applyMatrix4(m), V3(0.2, 0.36, sd * 0.27).applyMatrix4(m), V3(0.42, 0.3, sd * 0.22).applyMatrix4(m)], 0.05, 5, coat, wl);
  for (const sd of [-1, 1]) S.tube([V3(0.1, 0.06, sd * 0.1).applyMatrix4(m), V3(0.42, 0.1, sd * 0.12).applyMatrix4(m), V3(0.5, -0.3, sd * 0.12).applyMatrix4(m)], 0.07, 5, mul(coat, 0.7), wl);
}

// The leader / the second boat: a 12 m Nordland boat under one tan square sail, four crew looking to starboard.
async function boatGeo(seed = 0, pause) {      // pause: await between the big pieces (no long build step)
  const S = new Soup(), L = 12, FB = 0.95, H = hullInto(S, { L, B: 1.55, D: 0.55, F: FB, rise: 0.95, strakes: 6, stations: 20, post: 1.0, seed });
  await pause?.();
  thwarts(S, H, [-4.2, -2.6, -1.0, 0.9, 2.6, 4.2], FB);
  const mx = 0.7, top = 8.7, deck = -0.35;
  S.tube([V3(mx, deck, 0), V3(mx, 4, 0), V3(mx - 0.05, top, 0)], (t) => 0.11 * (1 - 0.5 * t), 8, mul(WOOD, 0.85), wl);
  const yy = top - 0.75, hw = 2.9;
  S.tube([V3(mx + 0.16, yy - 0.05, -hw - 0.3), V3(mx + 0.2, yy + 0.05, 0), V3(mx + 0.16, yy - 0.05, hw + 0.3)], (t) => 0.07 * (0.6 + 0.4 * Math.sin(Math.PI * t)), 6, mul(WOOD, 0.7), DRY);
  // the sail: 13 x 9 grid, bellied forward, cloths sewn in vertical panels, a darker reef band and a patch
  const nu = 12, nv = 8, y0 = FB + 1.25, rows = [];
  for (let v = 0; v <= nv; v++) { const row = [], fv = v / nv; for (let u = 0; u <= nu; u++) { const fu = u / nu, w = mix(hw + 0.2, hw, fv), belly = Math.sin(Math.PI * fu) * Math.sin(Math.PI * (0.12 + 0.82 * fv));
    row.push(V3(mx + 0.22 + 0.95 * belly + 0.1 * (1 - fv), mix(y0, yy - 0.12, fv) + 0.12 * Math.sin(Math.PI * fu) * (1 - fv), (fu * 2 - 1) * w)); } rows.push(row); }
  S.loft(rows, (i, j) => { const pan = Math.floor(j / 2), k = (0.9 + 0.16 * hash(pan * 5.3 + seed)) * (i === 5 ? 0.8 : 1) * (pan === 2 && i > 1 && i < 4 ? 0.74 : 1); return mul(TAN, k); },
    (i, j) => [Math.sin(Math.PI * j / nu) * Math.sin(Math.PI * (0.1 + 0.85 * i / nv)), 0, 10 + j], { closed: false });      // aFx.z >= 10: sailcloth, 10 + its coordinate across the sail (seams at the even ones)
  await pause?.();
  // stays and sheets: ropes that widen with distance in the shader (aFx.y)
  const rope = (a, b, sag = 0.25) => S.tube([a, a.clone().lerp(b, 0.5).add(V3(0, -sag, 0)), b], 0.022, 4, ROPE, [0, 1, 9]);
  rope(V3(mx, top - 0.1, 0), V3(L / 2 + 0.1, FB + 1.9, 0), 0.1); rope(V3(mx, top - 0.2, 0), V3(-3.6, FB + 0.1, 1.2), 0.1); rope(V3(mx, top - 0.2, 0), V3(-3.6, FB + 0.1, -1.2), 0.1);
  rope(V3(mx + 0.4, y0, hw + 0.2), V3(-3.2, FB, 1.3), 0.3); rope(V3(mx + 0.4, y0, -hw - 0.2), V3(-3.2, FB, -1.3), 0.3);
  const seat = (x) => { const q = H.sec(x); return q.yk + (q.ys - q.yk) * Math.pow(0.7, 1.25) + 0.03; };
  figureInto(S, V3(-4.3, seat(-4.2), 0.25), 1.2, seed, 0.9); figureInto(S, V3(-2.6, seat(-2.6), -0.3), 1.45, seed + 1, 1); figureInto(S, V3(-1.0, seat(-1.0), 0.35), 1.7, seed + 2, 0.7); figureInto(S, V3(2.6, seat(2.6), 0.1), 1.0, seed + 3, 0.5);
  await pause?.();
  return S.build();
}

// six-oared boat (attring), 8 m: three thwarts of rowers facing aft; the oars are separate instances
async function rowboatGeo(pause) {
  const S = new Soup(), L = 8, FB = 0.62, H = hullInto(S, { L, B: 1.05, D: 0.4, F: FB, rise: 0.75, strakes: 5, stations: 16, post: 0.7, seed: 5 });
  await pause?.();
  const xs = [-1.9, -0.3, 1.3]; thwarts(S, H, [...xs, 2.8, -3.0], FB);
  const seat = (x) => { const q = H.sec(x); return q.yk + (q.ys - q.yk) * Math.pow(0.7, 1.25) + 0.03; };
  xs.forEach((x, i) => { figureInto(S, V3(x, seat(x), -0.32), Math.PI, i, 0); figureInto(S, V3(x + 0.05, seat(x), 0.32), Math.PI, i + 2, 0); });
  figureInto(S, V3(-3.0, seat(-3.0), 0), 0, 3, 0);
  await pause?.();
  return { geo: S.build(), locks: xs.map((x) => [x - 0.45, FB + 0.06 + 0.75 * Math.pow(Math.abs(2 * (x - 0.45) / L), 2.6)]) };
}
function oarGeo() {
  const S = new Soup();   // pivot (the oarlock) at the origin, loom inboard (-Z... built along +Z outboard)
  S.tube([V3(0, 0, -0.9), V3(0, 0, 0), V3(0, 0, 2.4)], (t) => 0.035 * (1.1 - 0.3 * t), 5, PALE, DRY);
  S.loft([[V3(-0.02, 0.0, 2.3), V3(0.02, 0, 2.3)], [V3(-0.09, 0.015, 2.7), V3(0.09, 0.015, 2.7)], [V3(-0.1, 0.02, 3.35), V3(0.1, 0.02, 3.35)], [V3(-0.05, 0.02, 3.5), V3(0.05, 0.02, 3.5)]].map((r) => [r[0], r[1]]), mul(PALE, 1.15), DRY, { closed: false });
  return S.build();
}

// Turn a hull built by hullInto keel-up (rotate pi about X, lift it) and paint it as a bottom long in the water: tar
// brown-black, the keel and garboards worn pale, weed slime toward the waterline. aFx.z becomes the new height.
function keelUp(S, lift, keelY) {
  const slime = C('#2E3A1A'), worn = mul(PALE, 0.3);
  for (let i = 0; i < S.p.length; i += 3) {
    S.p[i + 1] = -S.p[i + 1] + lift; S.p[i + 2] = -S.p[i + 2]; S.n[i + 1] = -S.n[i + 1]; S.n[i + 2] = -S.n[i + 2]; S.f[i + 2] = S.p[i + 1];
    const y = S.p[i + 1], g = hash(i * 0.37), k = sstep(keelY - 0.2, keelY - 0.03, y) * 0.7, w = bell(y, -0.25, 0.5, 0.3) * (0.3 + 0.45 * g);
    for (let c = 0; c < 3; c++) S.c[i + c] = mix(mix(S.c[i + c] * 0.27, worn[c], k), slime[c] * 0.8, w);
  }
}

// The wreck. kind 0: a dismasted 14 m hull, starboard side stove in (ragged breach, ribs standing, swamped, water
// pouring back out in streams), a mast stump trailing rigging and a rag of sail.
// kind 1: an upturned whaleboat, keel in the air. kind 2: a raft of fish racks torn off a quay.
async function wreckGeo(kind, rng, pause) {
  const S = new Soup(), weed = C('#3E4A1E'), foam = C('#D8D6C8');
  if (kind === 0) {
    const nS = 7, cw = 14 / 24, jmin = (i) => [5, 4, 3, 3, 2, 3, 4, 5][i - 8] ?? 9;      // the breach: one rounded bite out of the starboard side, deepest amidships
    const stove = (i, j, side) => (side === 1 && i >= 8 && i <= 15 && j >= jmin(i)) || (side === -1 && i >= 3 && i <= 6 && j >= 6) || (side === 1 && (i === 7 || i === 16) && j >= 5);
    const FB = 1.35, H = hullInto(S, { L: 14, B: 1.95, D: 0.7, F: FB, rise: 1.25, strakes: nS, stations: 24, post: 1.1, seed: 9, skip: stove, ribBacks: true, ribW: 0.075,
      ribsUp: (i, side) => (side === 1 && i >= 8 && i <= 15 ? 0.35 + 0.95 * hash(i * 2.3) : 0) });
    await pause?.();
    thwarts(S, H, [-4.6, -2.4, 3.2, 5.0], FB);
    // a thwart knocked loose in the breach, one end down in the bilge, and the keelson along the bottom
    S.box(V3(0.5, 0.75, -0.25), 0.16, 0.03, 1.5, mul(WOOD, 0.85), wl, V3(0.96, 0, 0.28), V3(-0.1, 0.9, 0.42).normalize(), V3(-0.25, -0.42, 0.87).normalize());
    S.box(V3(0, -0.45, 0), 4.2, 0.07, 0.11, mul(TAR, 0.9), wl);
    // mast stump, leaning, with a splintered head
    const base = V3(0.9, -0.4, 0), head = V3(0.5, FB + 4.9, 0.55);
    S.tube([base, base.clone().lerp(head, 0.5).add(V3(0, 0, 0.05)), head], (t) => 0.19 * (1 - 0.25 * t), 9, (i, j) => mul(WOOD, 0.7 + 0.25 * hash(j * 3.3)), wl, { cap: false });
    for (let j = 0; j < 9; j++) { const a = (j / 9) * TAU, b = ((j + 1) / 9) * TAU, r = 0.145, hh = 0.3 + 0.9 * hash(j * 5.7);
      S.tri(head.clone().add(V3(Math.cos(a) * r, 0, Math.sin(a) * r)), head.clone().add(V3(Math.cos(b) * r, 0, Math.sin(b) * r)), head.clone().add(V3(Math.cos(a + 0.3) * r * 0.5, hh, Math.sin(a + 0.3) * r * 0.5)), mul(PALE, 1.15), DRY); }
    S.box(V3(0.72, FB + 1.3, 0.2), 0.23, 0.05, 0.23, mul(C('#2A2622'), 1), wl);                      // an iron band
    S.box(V3(0.6, FB + 3.5, 0.4), 0.21, 0.045, 0.21, mul(C('#2A2622'), 1), wl);
    // everything so far is old tarred wood: dark brown, a little salt-grey, slimed green near the waterline
    const slime = C('#2E3A1A');
    for (let i = 0; i < S.c.length; i += 3) { const l = (S.c[i] + S.c[i + 1] + S.c[i + 2]) / 3 * 1.2, y = S.p[i + 1], g = bell(y, -0.1, 1.15, 0.35) * 0.45 * hash(i * 0.11 + 3), k = 0.74 * (1 + 0.18 * sstep(1.3, 2.6, y));
      S.c[i] = mix(mix(S.c[i], l, 0.14) * k, slime[0], g); S.c[i + 1] = mix(mix(S.c[i + 1], l, 0.14) * k, slime[1], g); S.c[i + 2] = mix(mix(S.c[i + 2], l * 1.05, 0.14) * k, slime[2], g); }
    await pause?.();
    // the breach: every broken strake ends in a pale splinter and jagged stubs stand along its lower edge
    const sp = (x, s) => { const p = H.pt(x, Math.min(s, 1), 1); p.z += 0.035; return p; }, OUT = V3(0, -0.25, 1);
    for (let i = 7; i <= 16; i++) for (let j = 1; j < nS; j++) {
      if (stove(i, j, 1)) continue;
      const x0 = H.X(i), s0 = j / nS, s1 = (j + 1) / nS, hh = (k) => hash(i * 5.3 + j * 9.1 + k);
      for (const e of [-1, 1]) if (i + e >= 7 && i + e <= 16 && stove(i + e, j, 1)) { const xe = e > 0 ? x0 + cw : x0, len = cw * (0.3 + 0.65 * hh(e));
        S.tri(sp(xe, s0), sp(xe, s1), sp(xe + e * len, mix(s0, s1, 0.2 + 0.6 * hh(e + 3))), mul(PALE, 0.55 + 0.3 * hh(7)), wl, OUT); }
      if (j + 1 < nS && stove(i, j + 1, 1)) for (let t = 0; t < 2; t++) { const xa = x0 + cw * 0.5 * t, pk = xa + cw * (0.1 + 0.3 * hh(t + 11));
        S.tri(sp(xa, s1), sp(xa + cw * 0.5, s1), sp(pk, s1 + (0.3 + 0.75 * hh(t + 17)) / nS), t ? mul(TAR2, 0.55) : mul(PALE, 0.6), wl, OUT); }
    }
    // rigging trailing from the stump over the side, and a rag of the old sail still made fast to it
    const tr = (to, mid, w) => S.tube([head.clone().add(V3(0, -0.4, 0)), mid, to], 0.028, 4, mul(ROPE, 0.7), (i) => [w * i / 2, 1, 9]);
    tr(V3(-3.5, 0.1, 2.3), V3(-1, FB + 1.4, 1.9), 0.5); tr(V3(4.6, 0.0, 2.1), V3(2.6, FB + 1.7, 1.8), 0.5); tr(V3(-5.2, FB + 0.3, -1.0), V3(-2.2, FB + 2.3, -0.3), 0.8); tr(V3(1.5, FB + 0.4, -1.7), V3(1.2, FB + 2.4, -0.9), 0.4);
    { const rows = []; for (let v = 0; v <= 5; v++) { const row = [], fv = v / 5; for (let u = 0; u <= 4; u++) { const fu = u / 4, tear = 0.6 + 0.4 * hash(u * 3.7 + 1);
        row.push(V3(0.55 - 0.25 - 1.5 * fu * (0.5 + 0.5 * fv), FB + 4.5 - 2.3 * fv * tear - 0.25 * fu, 0.55 + 0.25 * fu + 0.3 * Math.sin(fu * 5 + v) * fv)); } rows.push(row); }
      S.loft(rows, (i, j) => mul(TAN, (0.62 + 0.3 * hash(j * 5.3)) * (1 - 0.06 * i)), (i, j) => [0.5 * i + 0.4 * j, 0, 9], { closed: false }); }
    // the hull is swamped: a surging sheet of white water inside (levelled against the list) ...
    { const rows = [], gW = C('#2A6654'); for (let ix = 0; ix <= 22; ix++) { const x = -5.2 + ix * (10.4 / 22), q = H.sec(x), w = q.b * Math.pow(sat((0.5 - q.yk) / (q.ys - q.yk)), 0.48) - 0.1, row = [];
        for (let k = 0; k <= 7; k++) { const z = (k / 7 * 2 - 1) * w; row.push(V3(x, 0.6 + 0.1 * z + 0.08 * Math.sin(ix * 1.9 + k * 2.3), z)); } rows.push(row); }
      S.loft(rows, (i, j) => { const f = hash(i * 3.7 + j * 9.3), g = hash(Math.floor(i / 2) * 5.1 + Math.floor(j / 2) * 2.7); return f * 0.5 + g * 0.5 > 0.5 ? mul(foam, 0.42 + 0.36 * f) : mul(gW, 0.5 + 0.9 * f); }, (i, j) => [1.2 + 1.6 * hash(i + j * 5.1), 0, 9], { closed: false }); }
    // ... pouring back out through the breach: four spills, each a few thin strands that taper, bead and break up as they
    // fall the half metre to the sea (the spray round them is the puffs, placePuffs)
    for (let k = 0; k < 16; k++) { const c = k % 4, x = -1.8 + c * 1.15 + 0.7 * (hash(k * 7.7) - 0.5), y0 = 0.66 + 0.12 * hash(k + 2), z0 = H.sec(x).b * 0.93, reach = 0.25 + 0.5 * hash(k * 3.1), r0 = 0.02 + 0.03 * hash(k + 5), y1 = 0.1 + 0.1 * (z0 + reach);
      const pts = []; for (let q = 0; q <= 4; q++) { const t = q / 4; pts.push(V3(x + 0.06 * Math.sin(t * 4 + k) * t, y0 + 0.06 * t - (y0 + 0.06 - y1) * t * t, z0 + reach * Math.pow(t, 0.8))); }
      S.tube(pts, (t) => r0 * (1 - 0.5 * t) * (0.75 + 0.45 * Math.sin(t * 9 + k * 2)), 3, (i, j) => mul(foam, 0.8 + 0.25 * hash(i * 2.1 + j + k)), (i) => [0.06 + 0.04 * i, 0, 9], { sx: 2.0, cap: false }); }
    // weed along the waterline
    for (let k = 0; k < 26; k++) { const side = k % 2 ? 1 : -1, x = -6.2 + 12.4 * hash(k * 1.9), a = H.pt(x, 0.42 + 0.1 * hash(k), side), b = H.pt(x + 0.35, 0.42 + 0.1 * hash(k + 3), side), l = 0.5 + 0.7 * hash(k * 4.1);
      a.z += side * 0.06; b.z += side * 0.06;
      S.loft([[a, b], [a.clone().add(V3(0.1, -l * 0.5, side * 0.12)), b.clone().add(V3(0.1, -l * 0.5, side * 0.12))], [a.clone().add(V3(0.3, -l, side * 0.3)), b.clone().add(V3(0.2, -l, side * 0.3))]], mul(weed, 0.7 + 0.6 * hash(k)), (i, j, p) => [i * 0.5, 0, p.y], { closed: false }); }   // aFx.z = its real height: what hangs under water takes the water's colour (it used to show as dark posts)
  } else if (kind === 1) {
    const hgt = 0.85;
    const S2 = new Soup(); hullInto(S2, { L: 9.5, B: 1.2, D: 0.5, F: 0.75, rise: 0.6, strakes: 6, stations: 20, post: 0.5, seed: 4, noRail: false, fx: () => DRY, lapped: true,
      skip: (i, j, side) => side === 1 && i >= 11 && i <= 13 && j >= 1 && j <= 2 });
    await pause?.();
    // flip it keel-up, lifted so the gunwale sits just under the water; a tarred clinker bottom, two planks stove in
    keelUp(S2, hgt - 0.1, 0.5 + hgt - 0.1);
    S.p = S2.p; S.n = S2.n; S.c = S2.c; S.f = S2.f;
    for (let k = 0; k < 18; k++) { const side = k % 2 ? 1 : -1, x = -4 + 8 * hash(k * 1.9), a = V3(x, 0.12, side * (1.12 - 0.1 * Math.abs(x) / 4)), b = a.clone().add(V3(0.4, 0, 0)), l = 0.5 + 0.6 * hash(k * 4.1);
      S.loft([[a, b], [a.clone().add(V3(0.15, -0.15, side * l * 0.5)), b.clone().add(V3(0.15, -0.15, side * l * 0.5))], [a.clone().add(V3(0.4, -0.25, side * l)), b.clone().add(V3(0.3, -0.25, side * l))]], mul(weed, 0.7 + 0.6 * hash(k)), (i, j, p) => [i * 0.5, 0, p.y], { closed: false }); }
    S.tube([V3(4.9, 0.6, 0), V3(6.2, 0.2, 0.5), V3(8.5, -0.05, 1.2)], 0.03, 4, ROPE, (i) => [i * 0.4, 1, 9]);   // the painter
  } else {
    // fish racks: five floating logs, three A-frames, rails, split cod hanging in pairs
    const pole = (a, b, r, tone = 1) => S.tube([a, a.clone().lerp(b, 0.5).add(V3(0.04 * (hash(a.x + b.z) - 0.5), 0.03, 0)), b], (t) => r * (1.08 - 0.25 * t), 6, (i, j) => mul(PALE, tone * (0.55 + 0.3 * hash(j * 3.1 + a.x))), wl);
    for (let k = 0; k < 5; k++) pole(V3(-5.5 - 0.4 * hash(k), 0.05 + 0.06 * hash(k + 2), -1.6 + k * 0.8), V3(5.5 + 0.5 * hash(k + 5), 0.08, -1.6 + k * 0.8 + 0.2 * (hash(k + 7) - 0.5)), 0.17, 0.8);
    for (const x of [-4.2, 0, 4.2]) { pole(V3(x, 0.1, -1.7), V3(x + 0.1, 4.3, 0.15), 0.08); pole(V3(x, 0.1, 1.7), V3(x - 0.1, 4.3, -0.15), 0.08); pole(V3(x, 0.15, -1.9), V3(x, 0.15, 1.9), 0.09, 0.8); }
    for (const [y, z] of [[4.0, 0], [2.9, -0.55], [2.9, 0.55], [1.9, -1.0], [1.9, 1.0]]) pole(V3(-5.0, y, z), V3(5.0, y + 0.08, z), 0.055);
    const fishC = C('#B9AE8C');
    for (let k = 0; k < 44; k++) { const row = k % 5, [y, z] = [[4.0, 0], [2.9, -0.55], [2.9, 0.55], [1.9, -1.0], [1.9, 1.0]][row], x = -4.6 + 9.2 * hash(k * 2.7 + 1), l = 0.7 + 0.25 * hash(k);
      for (const sd of [-1, 1]) S.loft([[V3(x - 0.02, y, z + sd * 0.03), V3(x + 0.02, y, z + sd * 0.03)], [V3(x - 0.1, y - l * 0.3, z + sd * 0.1), V3(x + 0.1, y - l * 0.3, z + sd * 0.1)], [V3(x - 0.07, y - l * 0.75, z + sd * 0.12), V3(x + 0.07, y - l * 0.75, z + sd * 0.12)], [V3(x, y - l, z + sd * 0.1), V3(x + 0.01, y - l, z + sd * 0.1)]],
        mul(fishC, 0.6 + 0.5 * hash(k * 1.3 + sd)), (i) => [i * 0.25, 0, 9], { closed: false }); }
    S.tube([V3(5.2, 0.3, 1.4), V3(6.8, 0.1, 2.2), V3(8.6, -0.05, 2.0)], 0.03, 4, ROPE, (i) => [i * 0.4, 1, 9]);
  }
  void rng;
  await pause?.();
  return S.build();
}

// upturned skiff, 4.6 m (a small keel-up hull with a split bottom)
function skiffGeo() {
  const S = new Soup();
  hullInto(S, { L: 4.6, B: 0.78, D: 0.3, F: 0.5, rise: 0.3, strakes: 5, stations: 14, post: 0.25, seed: 2, fx: () => DRY, lapped: true, skip: (i, j, side) => side === -1 && i >= 6 && i <= 7 && j === 1 });
  keelUp(S, 0.5, 0.8);
  return S.build();
}

const BARREL_PROFILE = [[0, -0.5], [0.2, -0.5], [0.27, -0.485], [0.3, -0.5], [0.32, -0.44], [0.345, -0.4], [0.335, -0.36], [0.38, -0.16], [0.4, -0.12], [0.39, -0.08], [0.4, 0], [0.39, 0.08], [0.4, 0.12], [0.38, 0.16], [0.335, 0.36], [0.345, 0.4], [0.32, 0.44], [0.3, 0.5], [0.27, 0.485], [0.2, 0.5], [0, 0.5]];
function barrelGeo() {
  const S = new Soup(), lathe = new THREE.LatheGeometry(BARREL_PROFILE.map((q) => new THREE.Vector2(q[0], q[1])), 14), iron = C('#8A8378');      // hoops: worn bright iron, lighter than the wet staves
  S.geo(lathe, new THREE.Matrix4().makeRotationZ(Math.PI / 2).scale(V3(0.92, 0.92, 0.92)), (p) => {      // true scale: 0.92 m long, 0.74 m at the bilge (at 1.9 m they read as giant cylinders beside the boats)
    const ay = Math.abs(p.y), hoop = (ay > 0.36 && ay < 0.44) || (ay > 0.08 && ay < 0.16), stave = Math.floor((Math.atan2(p.z, p.x) / TAU + 0.5) * 14);
    return hoop ? iron : mul(ay > 0.48 ? PALE : WOOD, 0.8 + 0.6 * hash(stave * 3.3) + (ay > 0.48 ? 0.4 : 0));      // pale round heads
  });
  lathe.dispose();
  return S.build();
}
// a yard with a rag of sail still bent to it: an 8 m spar, thick at the slings (an iron band there), floating cocked
// with one arm 1.6 m out of the water and snapped to a pale splintered end; from that arm hangs what is left of the
// sail, a torn triangle of cloth bellying and flapping, its foot awash
function yardGeo() {
  const S = new Soup(), ys = (x) => 0.08 + 0.2 * (x + 4.4) * (0.4 + 0.075 * (x + 4.4));      // the spar's height: awash at the butt, 1.7 m up at the broken arm
  const sp = []; for (let i = 0; i <= 8; i++) { const x = -4.4 + i; sp.push(V3(x, ys(x), 0.04 * Math.sin(i * 0.8))); }
  S.tube(sp, (t) => 0.105 * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, t * 1.08))), 8, (i, j) => mul(WOOD, 0.6 + 0.3 * hash(j * 2.1 + i)), wl, { cap: false });
  S.box(V3(-0.4, ys(-0.4), 0.02), 0.09, 0.125, 0.125, C('#2A2622'), wl);
  for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU, b = ((j + 1) / 8) * TAU, r = 0.1, y = ys(3.6); S.tri(V3(3.6, y + Math.cos(a) * r, Math.sin(a) * r), V3(3.6, y + Math.cos(b) * r, Math.sin(b) * r), V3(3.75 + 0.5 * hash(j * 3.1), y + 0.06 + Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4), mul(PALE, 1.1), DRY); }
  const nu = 10, nv = 5, rows = [], belly = (fu, fv) => Math.sin(Math.PI * fu) * Math.sin(Math.PI * Math.min(1, fv * 1.1));
  for (let v = 0; v <= nv; v++) { const row = [], fv = v / nv; for (let u = 0; u <= nu; u++) { const fu = u / nu, x = -2.2 + 5.6 * fu, top = ys(x) - 0.09, foot = top * (hash(u * 3.7) > 0.72 ? 0.45 : 0.04);      // some cloths are torn off short
    row.push(V3(x - 0.5 * fv * (1 - fu), mix(top, foot, fv), 0.03 + 0.55 * belly(fu, fv) + 0.08 * Math.sin(fu * 21 + v * 1.7) * fv + 0.5 * fv * fv)); } rows.push(row); }
  S.loft(rows, (i, j) => mul(TAN, (0.85 + 0.3 * hash(Math.floor(j / 2) * 5.3)) * (1 - 0.09 * i)), (i, j) => [0.9 * belly(j / nu, i / nv) + 0.15 * i / nv, 0, 10 + j], { closed: false });
  S.tube([V3(-4.3, 0.1, 0), V3(-5.4, 0.0, 0.8), V3(-7.0, -0.05, 0.9)], 0.025, 4, ROPE, (i) => [0.4 * i, 1, 9]);
  return S.build();
}
// net floats strung on a line, 11 m, lying along the flow
function floatsGeo() {
  const S = new Soup(), pts = [], ball = new THREE.SphereGeometry(0.19, 9, 6), glass = C('#4E9A78'), cork = C('#9A7A4E');
  for (let k = 0; k <= 22; k++) pts.push(V3(-5.5 + k * 0.5, 0.04, 0.55 * Math.sin(k * 0.45) + 0.2 * Math.sin(k * 1.3)));
  S.tube(pts, 0.022, 4, ROPE, [0, 1, 9]);
  for (let k = 1; k < 22; k += 2) { const g = (k >> 1) % 3 !== 0; S.geo(ball, new THREE.Matrix4().makeScale(1, g ? 1 : 0.7, g ? 1 : 1.3).setPosition(pts[k].x, 0.1, pts[k].z), (p) => mul(g ? glass : cork, 0.7 + 0.5 * sat(p.y * 4 + 0.5)), (p) => [0, 0, p.y + 0.1]); }
  ball.dispose();
  return S.build();
}
// the rare event's 18 m pine mast (along +X, butt at -9)
function mastGeo() {
  const S = new Soup(), n = 12, pts = []; for (let i = 0; i <= n; i++) pts.push(V3(-9 + 18 * i / n, 0.05 * Math.sin(i * 0.9), 0));
  S.tube(pts, (t) => 0.3 * (1 - 0.55 * t), 10, (i, j) => mul(i % 4 === 1 ? C('#241F1A') : WOOD, 0.75 + 0.35 * hash(j * 1.7 + i * 0.3)), DRY, { cap: false });
  for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU, b = ((j + 1) / 10) * TAU, r = 0.3; S.tri(V3(-9, Math.cos(a) * r, Math.sin(a) * r), V3(-9, Math.cos(b) * r, Math.sin(b) * r), V3(-9 - 0.3 - 0.9 * hash(j * 3.1), Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4), mul(PALE, 1.2), DRY); }
  S.box(V3(5, 0, 0), 0.12, 0.42, 0.06, mul(WOOD, 0.6), DRY); S.box(V3(7.6, 0, 0), 0.06, 0.05, 0.5, mul(WOOD, 0.6), DRY);
  for (const [x, z, l] of [[8.6, 0.2, 4.5], [7.5, -0.3, 6], [2, 0.3, 3.5]]) S.tube([V3(x, 0, z), V3(x - l * 0.4, -0.5, z * 3), V3(x - l, -0.2, z * 5)], 0.035, 4, ROPE, (i) => [0.5 * i, 1, 9]);
  return S.build();
}

// A fish 1 m long, head toward +X. kind 0 cod (olive, mottled, three dorsals, a barbel), 1 saithe (steel dark, silver)
function fishGeo(kind) {
  const S = new Soup(), back = kind ? C('#1C262B') : C('#3A3A20'), flank = kind ? C('#59666A') : C('#6E6A42'), belly = kind ? C('#C9CDC8') : C('#C2BA98');
  const st = kind ? [[0.5, 0.012, 0.01, 0], [0.42, 0.06, 0.04, 0], [0.24, 0.1, 0.062, 0.005], [0.02, 0.105, 0.064, 0.008], [-0.2, 0.075, 0.042, 0.004], [-0.36, 0.032, 0.02, 0], [-0.42, 0.026, 0.012, 0]]
    : [[0.5, 0.02, 0.018, -0.01], [0.42, 0.08, 0.055, -0.006], [0.25, 0.125, 0.078, 0], [0.04, 0.12, 0.074, 0.004], [-0.18, 0.08, 0.046, 0.004], [-0.35, 0.036, 0.022, 0], [-0.42, 0.03, 0.013, 0]];
  const tw = (x) => { const t = sat((0.3 - x) / 0.8); return t * t; };
  const rings = st.map(([x, h, w, dy]) => { const r = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; r.push(V3(x, dy + Math.cos(a) * h * (Math.cos(a) < 0 ? 1.1 : 0.9), Math.sin(a) * w)); } return r; });
  S.loft(rings, (i, j, p) => { const k = sat(p.y / 0.1 * 0.5 + 0.5), m = 0.8 + 0.4 * hash(i * 7.1 + j * 3.3); return k > 0.62 ? mul(back, m) : k > 0.36 ? mul(flank, m) : belly; }, (i, j, p) => [tw(p.x), 0, 9]);
  const fin = (a, b, c, col) => S.tri(a, b, c, col, (p) => [tw(p.x), 0, 9]);
  fin(V3(-0.4, 0.028, 0), V3(-0.56, 0.13, 0), V3(-0.5, 0, 0), mul(back, 1.2)); fin(V3(-0.4, -0.028, 0), V3(-0.5, 0, 0), V3(-0.56, -0.13, 0), mul(back, 1.2));
  if (kind) { fin(V3(0.2, 0.09, 0), V3(-0.02, 0.175, 0), V3(-0.12, 0.085, 0), back); fin(V3(-0.16, 0.075, 0), V3(-0.28, 0.12, 0), V3(-0.36, 0.035, 0), back); }
  else { fin(V3(0.24, 0.11, 0), V3(0.1, 0.19, 0), V3(0.06, 0.11, 0), back); fin(V3(0.04, 0.11, 0), V3(-0.1, 0.18, 0), V3(-0.16, 0.085, 0), back); fin(V3(-0.18, 0.075, 0), V3(-0.28, 0.125, 0), V3(-0.36, 0.036, 0), back); fin(V3(0.44, -0.07, 0), V3(0.41, -0.13, 0.004), V3(0.4, -0.075, 0), flank); }
  fin(V3(0.0, -0.1, 0), V3(-0.14, -0.16, 0), V3(-0.3, -0.045, 0), flank);
  for (const sd of [-1, 1]) fin(V3(0.27, -0.03, sd * 0.07), V3(0.12, -0.1, sd * 0.13), V3(0.14, -0.02, sd * 0.075), flank);
  return S.build();
}

// The grey seal, 1 unit long, head toward +X: a heavy dark-slate torpedo (deepest at the shoulders, no waist at the
// neck), a long sloping muzzle, the head turned 20 degrees to starboard (it is posed starboard side to the eye and looks at us),
// pale only on the throat and chest, with large dark dapples there and faint pale ones on the flank, small eyes in a
// dark patch ringed pale, narrow fore flippers curving aft (the far one hanging below the chest), hind flippers held
// together as one tapering paddle straight aft.
function sealGeo() {
  const S = new Soup(), n = 14, sub = 2;
  const K = [[0.5, 0.024, 0.03, -0.018], [0.489, 0.045, 0.05, -0.014], [0.464, 0.061, 0.064, -0.008], [0.428, 0.078, 0.078, 0.002], [0.385, 0.094, 0.095, 0.008], [0.335, 0.108, 0.11, 0.008], [0.275, 0.13, 0.135, 0.002],
    [0.175, 0.162, 0.172, -0.006], [0.045, 0.18, 0.192, -0.012], [-0.095, 0.166, 0.174, -0.01], [-0.225, 0.128, 0.13, -0.004], [-0.325, 0.088, 0.086, 0], [-0.405, 0.055, 0.057, 0.002], [-0.46, 0.036, 0.046, 0.002]];
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  const st = [];
  for (let i = 0; i < K.length - 1; i++) for (let q = 0; q < sub; q++) { const t = q / sub, a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)]; st.push([0, 1, 2, 3].map((m) => cr(a[m], b[m], c[m], d[m], t))); }
  st.push(K[K.length - 1]);
  const back = C('#262E33'), flank = C('#3A464D'), pale = C('#F2EDDC'), dark = C('#14181A');
  const tw = (x) => { const t = sat((0.2 - x) / 0.66); return t * t; };
  // the head turn: everything forward of the neck swings toward starboard (+Z) about the neck, a little chin-down
  const turn = (p) => { const k = sstep(0.27, 0.44, p.x), by = 0.36 * k, bz = -0.1 * k, dx = p.x - 0.3, c1 = Math.cos(by), s1 = Math.sin(by);
    const x1 = 0.3 + dx * c1 + p.z * s1 * -1, z1 = dx * s1 + p.z * c1, c2 = Math.cos(bz), s2 = Math.sin(bz), dx2 = x1 - 0.3;
    return p.set(0.3 + dx2 * c2 - p.y * s2, dx2 * s2 + p.y * c2, z1); };
  const EYE = [-1, 1].map((sd) => V3(0.432, 0.05, sd * 0.06));
  const rings = st.map(([x, h, w, dy]) => { const r = []; for (let j = 0; j < n; j++) { const a = (j / n) * TAU, ca = Math.cos(a); r.push(V3(x, dy + ca * h * (ca < 0 ? 1.04 : 0.96), Math.sin(a) * w * (1 + 0.06 * sat(-ca)))); } return r; });
  const cols = rings.map((ring, i) => ring.map((p, j) => {
    const v = Math.cos((j / n) * TAU), x = p.x;                     // v: 1 = spine, -1 = belly line
    // pale only on the throat and chest (x 0.2 - 0.47, the underside and lower flank; on the head it climbs the cheek to
    // just under the eye), breaking up into a few big pale dapples back along the belly
    const lim = mix(0.12, 0.42, sstep(0.36, 0.42, x)), hb = hash(Math.floor(i / 2) * 7.9 + Math.floor(j / 2) * 3.3 + 1);
    const chest = sstep(lim, lim - 0.45, v) * Math.max(sstep(0.2, 0.3, x), hb > 0.7 ? 0.6 * sstep(-0.1, 0.08, x) : 0) * (1 - sstep(0.455, 0.485, x));
    const h1 = hash(i * 3.1 + j * 7.7), h2 = hash(Math.floor(i / 2) * 11.3 + Math.floor(j / 2) * 5.9 + 2);
    let c = mixC(mixC(back, flank, sstep(0.45, -0.25, v) * (0.6 + 0.4 * h1)), pale, chest * (0.86 + 0.14 * h1));
    const h3 = hash(i * 5.7 + j * 13.1 + 4);
    if (h3 > 0.58 || h2 > 0.74) c = mixC(c, mul(back, 1.1), chest * 0.94);                         // large dark dapples on the pale throat and chest
    else if (h2 < 0.22 && x < 0.3 && x > -0.36) c = mixC(c, mul(flank, 2.6), 0.55 * (1 - chest) * sstep(0.7, 0.1, v));   // faint pale ones along the flank
    c = mixC(c, mul(flank, 1.9), sstep(0.4, 0.45, x) * sstep(0.5, 0.1, v) * (1 - chest) * 0.8);   // grey muzzle and cheeks under a dark crown
    const de = Math.min(p.distanceTo(EYE[0]), p.distanceTo(EYE[1]));
    c = mixC(c, dark, Math.max(0.85 * (1 - sstep(0.018, 0.045, de)), sstep(0.482, 0.497, x)));  // eye patches, the nose
    return mul(c, 0.9 + 0.2 * hash(i + j * 1.3));
  }));
  rings.forEach((r) => r.forEach(turn));
  S.loft(rings, (i, j) => cols[i][j], (i, j) => [tw(st[i][0]), 0, 9]);
  const fxT = (a, b, c) => [tw((c || a).x), 0, 9];
  // fore flippers: root low on the shoulder, a broad paddle fanning to five digits. `d` = where it points.
  // (a narrow paddle, widest two thirds out, its tip curving aft and ending in short blunt digits)
  const flipper = (sd, d, len, wide, tone) => {
    const root = V3(0.2, -0.075, sd * 0.155), ch = V3(-1, 0.1, 0).addScaledVector(d, d.x).normalize(), rows = [], nc = 6, nr = 6;
    for (let r = 0; r <= nr; r++) { const t = r / nr, w = wide * (0.42 + 0.66 * Math.sin(Math.PI * Math.min(1, 0.14 + 0.7 * t))) * (1 - 0.45 * sstep(0.8, 1, t)), row = [];
      for (let q = 0; q < nc; q++) { const e = q / (nc - 1), reach = len * (t * (r === nr ? 0.93 + 0.07 * (q % 2 ? 1 : 0.6) - 0.22 * e * e : 1 - 0.08 * e));
        row.push(root.clone().addScaledVector(d, reach).addScaledVector(ch, (e - 0.25) * w + 0.32 * len * t * t).add(V3(0, 0, sd * 0.01 * Math.sin(e * 9 + r)))); }
      rows.push(row); }
    S.loft(rows, (i, j) => mul(back, tone * (i === nr ? 0.75 : 1) * (0.88 + 0.24 * (j % 2))), fxT, { closed: false });
  };
  flipper(-1, V3(-0.22, -0.94, -0.26).normalize(), 0.33, 0.11, 1.0);     // port (the far one): hanging clear below the chest, swept back
  flipper(1, V3(-0.74, -0.5, 0.44).normalize(), 0.27, 0.095, 0.95);      // starboard (the near one): swept back along the flank
  // hind flippers: held palm to palm straight aft as ONE tapering paddle (spread, they read as a fish's forked tail):
  // a little wider two thirds out, then drawn in to a blunt rounded tip
  for (const sd of [-1, 1]) {
    const rows = [], nc = 5, nr = 5;
    for (let r = 0; r <= nr; r++) { const t = r / nr, row = [];
      for (let q = 0; q < nc; q++) { const e = q / (nc - 1) * 2 - 1, sp = (0.022 + 0.034 * Math.sin(Math.PI * Math.min(1, 0.95 * Math.pow(t, 0.8)))) * (1 - 0.35 * sstep(0.75, 1, t));
        row.push(V3(-0.44 - 0.22 * t * (r === nr ? 1 - 0.16 * e * e : 1), 0.004 + e * sp * (sd > 0 ? 1 : 0.9) + sd * 0.006 * t, sd * (0.012 + 0.028 * t * (1 - 0.6 * t) + 0.008 * t * Math.abs(e)))); }
      rows.push(row); }
    S.loft(rows, (i, j) => mul(back, (0.92 - 0.05 * i) * (0.88 + 0.24 * (j % 2))), fxT, { closed: false });
  }
  const eye = new THREE.SphereGeometry(0.016, 8, 6), ringC = C('#8A949A');
  for (const sd of [-1, 1]) {
    const e0 = EYE[sd < 0 ? 0 : 1], e = turn(e0.clone().add(V3(0, 0, sd * 0.004))); S.geo(eye, new THREE.Matrix4().setPosition(e.x, e.y, e.z), () => [0.002, 0.002, 0.003]);
    // a pale ring round the eye, lying on the skin of the dark patch
    { const nrm = V3(0.12, 0.62, sd * 0.78).normalize(), ax = V3(1, 0, 0).addScaledVector(nrm, -nrm.x).normalize(), ay = V3().crossVectors(nrm, ax), c0 = e0.clone().addScaledVector(nrm, 0.007), rp = (a, r) => turn(c0.clone().addScaledVector(ax, Math.cos(a) * r).addScaledVector(ay, Math.sin(a) * r).addScaledVector(nrm, -0.012 * (r > 0.025 ? 1 : 0)));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, b = ((k + 1) / 12) * TAU; S.quad(rp(a, 0.0185), rp(b, 0.0185), rp(b, 0.031), rp(a, 0.031), mul(ringC, 0.9 + 0.2 * hash(k * 3.1 + sd)), DRY); } }
    S.tri(turn(V3(0.497, -0.012, sd * 0.012)), turn(V3(0.489, 0.004, sd * 0.024)), turn(V3(0.484, -0.014, sd * 0.026)), dark, DRY);   // nostril
    for (let w = 0; w < 3; w++) S.tri(turn(V3(0.47, -0.03 - 0.008 * w, sd * 0.05)), turn(V3(0.452, -0.06 - 0.02 * w, sd * 0.125)), turn(V3(0.464, -0.036 - 0.008 * w, sd * 0.052)), mul(pale, 0.9), DRY);   // whiskers
  }
  eye.dispose();
  return S.build();
}

// The swimmer, 1 unit long, head toward +X. kind 0 grey seal (sealGeo), 1 harbour porpoise.
function swimmerGeo(kind) {
  if (!kind) return sealGeo();
  const S = new Soup(), n = 10;
  const st = [[0.5, 0.012, 0.012, 0], [0.45, 0.06, 0.055, 0.005], [0.36, 0.105, 0.095, 0.01], [0.2, 0.135, 0.125, 0.01], [0.02, 0.14, 0.125, 0], [-0.16, 0.11, 0.09, 0], [-0.3, 0.07, 0.05, 0.004], [-0.42, 0.035, 0.022, 0.006], [-0.47, 0.022, 0.014, 0.006]];
  const back = C('#76828A'), belly = C('#B8BAB4');      // (slate, a step off black: out of the water a #22 back was a crow)
  const tw = (x) => { const t = sat((0.25 - x) / 0.7); return t * t; };
  const rings = st.map(([x, h, w, dy]) => { const r = []; for (let j = 0; j < n; j++) { const a = (j / n) * TAU; r.push(V3(x, dy + Math.cos(a) * h, Math.sin(a) * w)); } return r; });
  S.loft(rings, (i, j, p) => { const k = sat(p.y / 0.14 * 0.5 + 0.55 + 0.25 * (hash(i * 3.1 + j * 7.7) - 0.5)); return mul(mixC(belly, back, sstep(0.3, 0.6, k)), 0.9 + 0.2 * hash(i + j * 1.3)); }, (i, j, p) => [tw(p.x), 0, 9]);
  const fx1 = (a, b, c) => [tw((c || a).x), 0, 9];
  S.tri(V3(0.02, 0.135, 0), V3(-0.1, 0.26, 0), V3(-0.16, 0.115, 0), back, fx1);
  for (const sd of [-1, 1]) { S.quad(V3(-0.44, 0.008, 0), V3(-0.5, 0.012, sd * 0.13), V3(-0.57, 0.01, sd * 0.12), V3(-0.5, 0.006, 0), back, fx1); S.quad(V3(0.24, -0.08, sd * 0.1), V3(0.16, -0.17, sd * 0.2), V3(0.1, -0.16, sd * 0.19), V3(0.14, -0.07, sd * 0.11), back, fx1); }
  return S.build();
}

// one kelp frond 3 m long streaming toward +X: a ruffled blade on a stipe, with float bladders
function kelpGeo() {
  const S = new Soup(), n = 12, olive = C('#5A5326'), gold = C('#8A7424'), rows = [];
  for (let i = 0; i <= n; i++) { const t = i / n, w = 0.05 + 0.24 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.3 * t), row = [];
    for (let j = 0; j < 4; j++) { const s = j / 3 * 2 - 1; row.push(V3(3 * t, 0.07 * Math.sin(t * 15 + j * 1.9) * Math.abs(s) + 0.05 * Math.sin(t * 6), s * w)); } rows.push(row); }
  S.loft(rows, (i, j) => mul(j === 0 || j === 3 ? gold : olive, 0.7 + 0.5 * hash(i * 1.7 + j)), (i) => [Math.pow(i / n, 1.3), 0, 9], { closed: false });
  const b = new THREE.SphereGeometry(0.06, 5, 4); for (let k = 0; k < 3; k++) S.geo(b, new THREE.Matrix4().setPosition(0.25 + 0.3 * k, 0.03, (k % 2 ? 0.07 : -0.07)), () => mul(gold, 1.1), () => [0.02 * k, 0, 9]); b.dispose();
  return S.build();
}
// a raft of torn kelp and bladderwrack, radius 1, lying on the water (scaled 1-3 per instance): a low olive-brown mat
// of overlapping weed pads, ragged at the edge, with narrow gold-edged fronds trailing off it and arching out of it,
// each tapering to a point, and bladders along them. Drawn with its own material (no waterline collar: that painted
// the pads as pale plates).
function raftGeo() {
  const S = new Soup(), olive = C('#4E4820'), dark = C('#342F14'), gold = C('#6E5C20'), edge = C('#8E7626');
  for (let k = 0; k < 30; k++) {
    const a = hash(k * 4.7) * TAU, rr = Math.pow(hash(k * 2.3 + 1), 0.65) * 0.85, cx = Math.cos(a) * rr, cz = Math.sin(a) * rr, pr = 0.16 + 0.26 * hash(k * 9.1), h = 0.05 + 0.12 * hash(k * 1.9) * (1 - rr * 0.7);
    const top = V3(cx, h, cz), col = mul(k % 4 === 0 ? gold : k % 3 === 0 ? dark : olive, 0.62 + 0.42 * hash(k * 3.3)), m = 7, ring = [];
    for (let j = 0; j < m; j++) { const b = (j / m) * TAU + k, r = pr * (0.55 + 0.8 * hash(k * 7.7 + j * 3.1)); ring.push(V3(cx + Math.cos(b) * r, -0.01, cz + Math.sin(b) * r)); }
    for (let j = 0; j < m; j++) S.tri(ring[j], ring[(j + 1) % m], top, mul(col, 0.8 + 0.35 * hash(k + j * 5.3)), DRY, V3(0, 1, 0));
  }
  for (let k = 0; k < 20; k++) { const a = hash(k * 4.3 + 2) * TAU, r0 = 0.2 + 0.5 * hash(k), l = 0.5 + 0.7 * hash(k + 3), d = V3(Math.cos(a), 0, Math.sin(a)), s = V3(-d.z, 0, d.x), rows = [], arch = k % 3 === 0 ? 0.26 : 0.07, n = 6;
    const body = mul(k % 2 ? gold : olive, 0.75 + 0.35 * hash(k * 1.1));
    for (let i = 0; i <= n; i++) { const t = i / n, c = d.clone().multiplyScalar(r0 + l * t).addScaledVector(s, 0.14 * Math.sin(t * 5 + k)).add(V3(0, 0.08 + arch * Math.sin(Math.PI * t) - 0.08 * t, 0)), w = 0.04 * Math.pow(1 - t, 0.7) * (1 + 0.5 * Math.sin(Math.PI * t));
      rows.push([-1, -0.45, 0.45, 1].map((e, j) => c.clone().addScaledVector(s, e * w).add(V3(0, 0.012 * (j % 3 ? 1 : 0) + 0.01 * Math.sin(t * 17 + j * 2 + k), 0)))); }
    S.loft(rows, (i, j) => mul(j === 0 || j === 3 ? edge : body, 0.85 + 0.06 * i), DRY, { closed: false }); }
  const bead = new THREE.SphereGeometry(0.04, 5, 3);
  for (let k = 0; k < 12; k++) { const a = hash(k * 6.1) * TAU, r = 0.2 + 0.7 * hash(k * 2.9); S.geo(bead, new THREE.Matrix4().setPosition(Math.cos(a) * r, 0.09 + 0.05 * hash(k), Math.sin(a) * r), () => mul(edge, 1.1)); }
  bead.dispose();
  return S.build();
}

// ---------------------------------------------------------------- 3. the one lit material for everything built here
const PROP_VS = /* glsl */`
${MAELSTROM_GLSL}
attribute vec3 color; attribute vec3 aFx;
uniform vec4 uWig, uSeal, uMat; uniform vec3 uFd;      // uFd: instanced things under water draw in to nothing between x and y metres from the eye; z 1 = and where the eye sees them flatter than ~10 degrees to the wall (the shoal)
varying vec3 vWp, vN, vCol; varying float vH, vCl, vBelly;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  #ifdef USE_INSTANCING
    mat4 M = modelMatrix * instanceMatrix;
  #else
    mat4 M = modelMatrix;
  #endif
  float ph = dot(M[3].xyz, vec3(0.37, 0.71, 0.53));
  float w = aFx.x * uWig.x * sin(uTime * uWig.y + ph - p.x * uWig.z);
  if (uWig.w < 0.5) p.z += w; else if (uWig.w < 1.5) p += normal * w; else p.y += w;
  vec4 wp = M * vec4(p, 1.0);
  #ifdef USE_INSTANCING
    // the fish and the kelp under the water draw in to nothing between 34 and 60 m: through the far, pale surface they were stray black dashes
    float dI = length(M[3].xyz - uCam), shr = smoothstep(uFd.x, uFd.y, dI);
    if (uFd.z > 0.5) {      // a fish seen nearly along the surface is a flat dark-green cut-out under the lace: it is not drawn
      float rI = max(length(M[3].xz), 1.0), xI = (300.0 - clamp(rI, 55.0, 300.0)) / 245.0, slI = 330.0 * xI * xI / 245.0;
      vec3 nI = normalize(vec3(-slI * M[3].x / rI, 1.0, -slI * M[3].z / rI));
      shr = max(shr, 1.0 - smoothstep(0.24, 0.4, abs(dot(nI, M[3].xyz - uCam)) / max(dI, 1e-3)));      // (gone by 14 degrees: up the wall from the eye they lay on the glass like paper fish)
    }
    wp.xyz = mix(wp.xyz, M[3].xyz, step(0.01, uMat.x) * shr);
  #endif
  vec3 wn = mat3(M) * normal; wn /= max(length(wn), 1e-5);
  float dist = length(wp.xyz - uCam);
  wp.xyz += wn * aFx.y * mix(max(dist * 0.0013 - 0.022, 0.0), -0.03, smoothstep(60.0, 95.0, dist));          // ropes stay ~1.5 px wide out to 60 m, then draw in to nothing (far rigging read as stray black dashes)
  vec3 ds = M[3].xyz - uSeal.xyz; float dl = max(length(ds), 0.01);
  wp.xyz += ds / dl * uSeal.w * (1.0 - smoothstep(1.5, 7.0, dl)) * 2.6;   // the shoal parts round the swimmer
  vWp = wp.xyz; vN = wn; vCol = color; vH = aFx.z; vCl = clamp(aFx.x * 3.0, 0.0, 1.0); vBelly = aFx.x;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PROP_FS = /* glsl */`
${MAELSTROM_GLSL}
uniform vec4 uMat;      // x: 1 = under water, y: specular, z: wet + foam collar at the waterline, w: cloth translucency
uniform vec4 uLk;       // x: sky-fill scale, y: rim-light gain, z: 1 = broad back-light lobe (the wreck against the low sun), w: wet sheen (sky and the water's glow on its edges: the barrels)
uniform vec3 uTint;
varying vec3 vWp, vN, vCol; varying float vH, vCl, vBelly;
#include <fog_pars_fragment>
void main(){
  vec3 Vd = uCam - vWp; vec3 V = Vd / max(length(Vd), 1e-4);
  vec3 N = vN / max(length(vN), 1e-5); if (dot(N, V) < 0.0) N = -N;
  float lit = sunLit(vWp), ndl = dot(N, uSunDir);
  float ndlRaw = dot(vN / max(length(vN), 1e-5), uSunDir);
  vec3 alb = vCol * uTint;
  // sailcloth (vH >= 10 on a cloth material): sewn seams between the cloths, the belly catching the light and the
  // leeches, head and foot falling into shade, faint vertical wrinkles. It has form in the rim's shadow too, where
  // there is no sun to model it (it read as a flat yellow rectangle).
  float sc = vH - 10.0, scw = fwidth(vH), isSail = step(9.5, vH) * step(0.5, uMat.w);
  float seamW = 0.05 + 1.2 * scw, seam = (1.0 - smoothstep(0.0, seamW, abs(fract(sc * 0.5 + 0.5) - 0.5) * 2.0)) * min(1.0, 0.07 / seamW);
  alb *= mix(1.0, mix(0.52, 1.08, smoothstep(0.0, 0.85, vBelly)) * (1.0 - 0.45 * seam) * (0.95 + 0.05 * sin(sc * 5.2 + vBelly * 9.0)), isSail);
  float wet = (1.0 - smoothstep(0.02, 0.45, vH)) * uMat.z;
  alb *= (1.0 - 0.4 * wet) * mix(1.0, 0.45 + 0.55 * smoothstep(-0.3, 0.0, vH), uMat.z);          // dark where it is under water
  vec3 hemi = (uAmb * (1.5 + 0.5 * N.y) + skyCol(vec3(N.x, max(N.y, 0.06), N.z)) * 0.3 + uBottle * 0.4 * max(-N.y, 0.0)) * uLk.x;
  float fres = clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), back = max(dot(-V, uSunDir), 0.0);
  float tr = uMat.w * vCl;
  vec3 col = alb * (uSunCol * lit * (max(ndl * 0.8 + 0.2, 0.0) * (1.0 - tr * 0.4) + tr * 0.6 * abs(ndlRaw)) + hemi);
  float rimL = fres * fres * mix(fres, 1.0, 0.5 * uLk.z) * mix(back * back, back, uLk.z) * uLk.y;
  col += uSunCol * lit * rimL * (0.25 + 0.5 * alb);          // a gold edge on anything seen against the sun
  vec3 Rv = reflect(-V, N);
  float sp = pow(max(dot(Rv, uSunDir), 0.0), 36.0);
  col += uSunCol * lit * sp * uMat.y * (0.25 + wet);
  col += skyCol(vec3(Rv.x, abs(Rv.y), Rv.z)) * (fres * fres * fres * fres) * 0.06 * (1.0 + 2.0 * wet);
  col += (skyCol(vec3(Rv.x, abs(Rv.y), Rv.z)) * 0.5 + (uGold * 0.5 + uGlow * 0.5) * uGlowAmt * 0.5 * sunLobe(vWp.xz / max(length(vWp.xz), 1e-3)) * exp(-max(-vWp.y, 0.0) / (uGlowFall * 2.0))) * (0.05 + 0.8 * fres * fres * fres) * uLk.w;
  // nothing of ours is pure black: the grade takes anything under ~0.06 to black, and a tarred hull in the squall's shade
  // was a black slab. Wet timber keeps a dark brown floor, a step lighter on the faces turned to the sky.
  // the exit ring lights whatever rides near it (the boat on the lip): warm, from below
  vec3 toR = uSeat.xyz - vWp; float dR = max(length(toR), 1e-3);
  col += alb * mix(uGold, vec3(1.0, 0.86, 0.62), 0.3) * uSeat.w * exp(-dR / 80.0) * (0.3 + 0.7 * max(dot(N, toR / dR), 0.0)) * 1.3;
  col = max(col, (alb * 0.3 + vec3(0.072, 0.064, 0.056)) * (0.85 + 0.45 * max(N.y, 0.0)));
  // under the waterline the hull takes the colour of the water it sits in (in a trough it shows, and must not stand
  // out as posts); at the waterline one thin broken foam line (it used to cover everything under water, which showed
  // through the translucent surface as pale blocks)
  // (on the glass the water it sits in glows: a dark keel there showed through the wall as a grey slab under the hull)
  float rW = max(length(vWp.xz), 1e-3);
  vec3 seaC = mix(uBottle, uDeep, 0.25) * (0.75 + 0.35 * lit) + uGlow * uGlowAmt * exp(-max(-vWp.y, 0.0) / uGlowFall) * sunLobe(vWp.xz / rW) * (1.0 - smoothstep(288.0, 302.0, rW)) * 0.7;
  col = mix(col, seaC, (1.0 - smoothstep(-0.32, -0.02, vH)) * uMat.z * 0.85);
  float collar = (1.0 - smoothstep(-0.04, 0.1, vH)) * smoothstep(-0.3, -0.05, vH) * uMat.z;
  collar *= 0.3 + 0.7 * smoothstep(0.34, 0.6, texture2D(uNoise, vWp.xz * 0.19 + vec2(vWp.y * 0.11, uTime * 0.03)).g);
  col = mix(col, uFoam * 0.7 * (uSunCol * lit * 0.6 + uAmb), collar * 0.85);
  if (uMat.x > 0.01) {
    float r = max(length(vWp.xz), 1e-3); vec2 rh = vWp.xz / r;
    float dd = max(-vWp.y, 0.0), lobe = sunLobe(rh);
    vec3 glow = uGlow * uGlowAmt * exp(-dd / uGlowFall) * lobe;
    vec3 water = mix(uBottle, uDeep, smoothstep(10.0, 70.0, dd)) * 0.62 + glow * 0.75;
    vec3 inL = uAmb * 0.55 + glow * (0.5 + 0.8 * max(dot(N, vec3(rh.x, 0.25, rh.y)), 0.0)) + uSunCol * lit * 0.3 * max(N.y, 0.0);
    col = alb * inL * (0.5 + 0.5 * max(dot(N, V), 0.0)) + glow * alb * fres * fres * 1.2 + uSunCol * sp * uMat.y * 0.3 * (lit + lobe);   // rounded by the view, edged by the light behind
    col *= mix(1.0, 0.34, step(0.4, uMat.x));      // fish and kelp are dark shapes against the lit glass (lit by the glow they were as pale as the water)
    col = max(col, vec3(0.048, 0.082, 0.072) * (0.6 + 0.9 * max(N.y, 0.0)) * step(0.4, uMat.x));
    col = mix(col, water, 0.6 * fres * fres * step(0.4, uMat.x));      // (and its outline melts into the water: with a hard edge it was a cut-out)      // a fish or a frond in the glass is dark green, its back a step lighter: never a pure black cut-out (not the seal: its own slate shading is kept)
    float inside = max((wallYg(r) - vWp.y) * 0.72, 0.0);
    col = mix(col, water, (1.0 - exp(-(inside + length(Vd) * 0.15) / 9.0)) * mix(uMat.x, 1.0, smoothstep(26.0, 64.0, length(Vd))));      // beyond 60 m only water: far kelp showed through the pale surface as black dashes
  }
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, fogColor, ff);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;
// soft round puffs of spray (CPU-placed instances): bow bursts, the sluice at the wreck, the water the mast trails
const PUFF_VS = /* glsl */`
${MAELSTROM_GLSL}
attribute vec4 aP, aQ;      // aP: xyz, size   aQ: alpha, seed, brightness - 1, erosion (0 soft puff .. 1 torn)
varying vec2 vQ; varying vec3 vK; varying vec2 vBr;
#include <fog_pars_vertex>
void main(){
  vec4 mvPosition = viewMatrix * vec4(aP.xyz, 1.0);
  mvPosition.xy += position.xy * aP.w;
  vQ = position.xy; vK = vec3(aQ.x * sunLit(aP.xyz), aQ.y, aQ.x); vBr = vec2(1.0 + aQ.z, aQ.w);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FS = /* glsl */`
${MAELSTROM_GLSL}
varying vec2 vQ; varying vec3 vK; varying vec2 vBr;
#include <fog_pars_fragment>
void main(){
  float rr = dot(vQ, vQ); if (rr > 1.0) discard;
  float n = texture2D(uNoise, vQ * 0.23 + vec2(vK.y * 7.3, vK.y * 3.1 - uTime * 0.05)).g;
  float n2 = texture2D(uNoise, vQ * 0.61 + vec2(vK.y * 2.9 + 0.4, vK.y * 5.7 - uTime * 0.11)).r;
  float a = (1.0 - smoothstep(0.08, 1.0, rr)) * smoothstep(0.3 + 0.1 * vBr.y, 0.8, n + (1.0 - rr) * (0.42 - 0.08 * vBr.y) - vBr.y * 0.2 * (1.0 - n2)) * vK.z;
  vec3 c = uFoam * 0.72 * vBr.x * (uAmb * 1.25 + uSunCol * 0.6 * vK.x / max(vK.z, 1e-3)) * a;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    c = mix(c, fogColor * a, ff);
  #endif
  gl_FragColor = vec4(c, a);
}`;
// far rain curtains under the squall: streaked sheets hanging from the cloud base
const RAIN_VS = /* glsl */`
varying vec2 vUv; varying vec3 vWp;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RAIN_FS = /* glsl */`
uniform sampler2D uNoise; uniform float uTime; uniform vec3 uRainCol;
varying vec2 vUv; varying vec3 vWp;
void main(){
  float streak = texture2D(uNoise, vec2(vUv.x * 3.0 + vUv.y * 0.35, vUv.y * 0.12 + uTime * 0.02)).g;
  float body = texture2D(uNoise, vec2(vUv.x * 0.7 + 0.3, 0.37 + uTime * 0.003)).g;
  float a = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x)) * smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y) * 0.6);
  a *= (0.45 + 0.55 * streak) * smoothstep(0.25, 0.7, body) * 0.62;
  gl_FragColor = vec4(uRainCol * a, a);
}`;
// The storm shelf: one flat sheet of cloud 520 m over the sea, wound into spiral arms about the funnel's axis and turning
// with the water, with an open eye over the throat and a slot left open toward the low sun. Seen from below: slate
// bellies, the edges turned to the sun lit peach, fading into the horizon's own colour with distance.
const SHELF_VS = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SHELF_FS = /* glsl */`
${MAELSTROM_GLSL}
uniform vec3 uLitC, uShadeC; uniform vec4 uShelf; uniform vec2 uSlot;      // amount, haze length (m), turn (rad), arm spacing (m); uSlot: the opening toward the sun (cosine of the bearing from the sun: none .. full)
varying vec3 vW;
float shelfRaw(vec2 p){
  float r = length(p), a = 1.7 * log(max(r, 90.0) / 400.0) + uShelf.z, c = cos(a), s = sin(a);
  vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  float n = texture2D(uNoise, q / 1900.0).g * 0.56 + texture2D(uNoise, q / 610.0 + 0.37).g * 0.3 + texture2D(uNoise, q / 190.0 + 0.71).g * 0.14;
  float band = 0.5 + 0.5 * sin(q.x * TAU / uShelf.w + 4.0 * (n - 0.5));
  return n * 0.72 + band * 0.3 + 0.16 * (1.0 - smoothstep(300.0, 2000.0, r));
}
void main(){
  vec2 p = vW.xz; float r = max(length(p), 1.0);
  float raw = shelfRaw(p), d = smoothstep(0.46, 0.6, raw), thick = smoothstep(0.52, 0.86, raw);
  float dS = smoothstep(0.46, 0.6, shelfRaw(p + uSunH * 230.0)), dS2 = smoothstep(0.46, 0.6, shelfRaw(p + uSunH * 620.0));
  float lit = clamp(0.34 + (d - dS) * 0.8 + (d - dS2) * 0.5 - 0.22 * thick, 0.0, 1.0);      // the edges turned to the low sun
  vec3 col = mix(uShadeC * mix(1.3, 0.62, thick), uLitC, lit * lit) + uSunCol * 0.07 * lit * (1.0 - thick);
  vec3 V = vW - uCam; float dist = max(length(V), 1.0); V /= dist;
  float hz = 1.0 - exp(-dist / uShelf.y);
  col = mix(col, mix(uSkyCool * 0.85, skyCol(vec3(V.x, 0.02, V.z)), 0.35), hz * 0.85);
  float sunSide = smoothstep(uSlot.x, uSlot.y, dot(p / r, uSunH));
  float a = d * uShelf.x * smoothstep(100.0, 340.0, r) * (1.0 - smoothstep(2500.0, 4250.0, r)) * (1.0 - sunSide * smoothstep(800.0, 1900.0, r));
  gl_FragColor = vec4(col * a, a);
}`;
// Stratocumulus bars across the sun's quarter of the sky (which the shelf leaves open): long lenses of cloud 2 - 3 km out,
// seen from below and against the light: slate bellies, the lower (sunward) edge and every thin place lit peach.
const BAR_VS = /* glsl */`
attribute vec4 aBar;      // along -1..1, across -1 (the edge nearest the funnel) .. 1 (the edge toward the sun), seed, opacity
varying vec4 vB; varying vec3 vW;
void main(){ vB = aBar; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BAR_FS = /* glsl */`
${MAELSTROM_GLSL}
uniform vec3 uLitC, uShadeC;
varying vec4 vB; varying vec3 vW;
void main(){
  vec2 q = vB.xy;
  // noise drawn out along the bar: its edges are streaks and long lumps, never blots
  float n = texture2D(uNoise, vec2(q.x * 0.55 + vB.z * 7.3 + uTime * 0.0009, q.y * 0.05 + vB.z * 3.1)).g;
  float n2 = texture2D(uNoise, vec2(q.x * 2.3 + vB.z * 2.9 - uTime * 0.002, q.y * 0.14 + vB.z * 5.7)).g;
  // a flat base (the edge toward the sun, the lower edge as we see it), a lumpy top, both ends drawn out to a point
  float ax = abs(q.x), taper = 1.0 - ax * ax;
  float base = 1.0 - smoothstep(-0.1, 0.12, q.y - 0.55 * taper - 0.1 * (n - 0.5));
  float top = smoothstep(-0.14, 0.2, q.y + (0.25 + 0.6 * n2) * taper * (0.55 + 0.45 * n));
  float ends = 1.0 - smoothstep(0.7, 1.0, ax + 0.25 * (n - 0.5));
  float a = base * top * ends;
  vec3 V = normalize(vW - uCam);
  float toSun = max(dot(V, uSunDir), 0.0);
  float under = smoothstep(-0.25, 0.5, q.y - 0.55 * taper + 0.5) ;      // 0 at the lumpy top .. 1 at the base
  vec3 col = mix(uShadeC * (1.25 - 0.35 * under), uLitC * 1.3, under * under * (0.6 + 0.4 * toSun));
  col = mix(col, skyCol(vec3(V.x, max(V.y, 0.02), V.z)), 0.2);
  a *= vB.w;
  gl_FragColor = vec4(col * a, a);
}`;
const PREMUL = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };

// ---------------------------------------------------------------- 4. SEEDED MOODS: hour x weather x cast
// colours are sRGB hex unless they are arrays (linear). sunEl/sunAz in degrees (az: 0 = -Z north, 90 = +X east).
const HOURS = {
  golden: { sunEl: 9, sun: '#FFD9A0', sunI: 1.6, amb: [0.2, 0.31, 0.46], zenith: '#6F93A8', warm: '#F7CF8C', cool: '#86A5B4', glow: 1, exposure: 1.0,
    sky: { preset: 'goldenHour', zenith: '#4F7C9C', mid: '#9DBBAA', horizon: '#F2C684', scatterColor: '#FFB25A', scatter: 0.62, scatterPow: 3, sunColor: '#FFD9A0', sunSize: 1.15, sunIntensity: 11, sunGlow: 0.7 },
    cloudLit: '#F3C8A0', cloudShade: '#2C4A66', fog: '#B8B6A4', tint: '#FFF6EA', shadowTint: '#07131F' },
  day: { sunEl: 28, sun: '#FFF2DE', sunI: 1.75, amb: [0.25, 0.36, 0.5], zenith: '#4A86BC', warm: '#DCE8E2', cool: '#A6C8DC', glow: 0.85, glowColor: '#49C8A6', bottle: '#1B6E62', exposure: 0.95,
    sky: { preset: 'day', zenith: '#2F6FB0', horizon: '#CFE3EA', sunColor: '#FFF4E0', sunSize: 1.3, sunIntensity: 12 },
    cloudLit: '#F6F3EC', cloudShade: '#5E7690', fog: '#BFD2DA', tint: '#FBFFFF', shadowTint: '#061422', mistbow: true },
  dawn: { sunEl: 3, sun: '#FF7E4E', sunI: 1.4, amb: [0.16, 0.16, 0.34], zenith: '#3C487C', warm: '#F08C60', cool: '#5F5C90', glow: 1.15, glowColor: '#F0602C', gold: '#FF8A4A', exposure: 1.1,
    sky: { preset: 'dawn', zenith: '#2C3A72', mid: '#7A6C9C', horizon: '#F0906A', scatterColor: '#FF6A3A', scatter: 0.8, scatterPow: 3, sunColor: '#FF7A4A', sunSize: 1.5, sunIntensity: 10 },
    cloudLit: '#F39A78', cloudShade: '#3A3A66', fog: '#9C7F8E', tint: '#FFF0EC', shadowTint: '#0E0A24', noIslands: true },
  night: { sunEl: 26, sun: '#C4D4FF', sunI: 0.95, amb: [0.07, 0.15, 0.2], zenith: '#0A1226', warm: '#2A3F5C', cool: '#131F36', glow: 0.32, glowColor: '#42E0C2', foam: '#B4FFF0', exposure: 1.45,
    sky: { preset: 'night', aurora: 0.55, auroraAzimuth: -50, auroraSpread: 0.6, bodyOverrides: { 0: { elevation: 26, azimuth: 120, size: 2.6 } } },
    cloudLit: '#8FA6C8', cloudShade: '#101A2C', fog: '#16233A', tint: '#EAF4FF', shadowTint: '#02060E', night: true },
};
const WEATHERS = {
  clear: { fog: 0.00066, cover: 0.6, sunK: 1, ambK: 1, glowK: 1, shade: [0.0031, 0.0052, 0.38, 0.45, 0.8], islands: true },
  // the squall comes in two kinds by seed (search "squall kind"): slate with a low gold slot, or iron with a pale cold band
  squall: { fog: 0.0012, cover: 0.9, sunK: 1.12, ambK: 0.8, glowK: 0.86, shade: [0.0008, 0.0056, 0.9, 0.08, 0.26], islands: true, rain: true,
    zenith: '#3E5062', warm: '#9DA7A6', cool: '#5C6E7C', fogColor: '#6F7C84', cloudLit: '#93A8BC', cloudShade: '#1C3048' },
  // 'fog' is sea smoke: thick on the race (the far wall a ghost), thin once we are over the rim, under the same storm sky
  fog: { fog: 0.0011, fogNear: 0.0023, cover: 0.66, sunK: 0.9, ambK: 1.1, glowK: 0.9, shade: [0.003, 0.005, 0.3, 0.45, 0.8], islands: false, veil: 0.6 },
};
const BIRDS = {
  gulls: { size: 1.5 },
  kittiwakes: { size: 1.25, palette: { tip: '#15171a', wingC: '#aab2bc', beak: '#d8c23a' } },
  gannets: { size: 2.1, palette: { tip: '#0c0c0e', wingC: '#f1efe6', body: '#f4f1e6', head: '#e9d49a', beak: '#9fb0b8' } },
};

function propMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U,
      uWig: { value: new THREE.Vector4(...(o.wig || [0, 0, 0, 0])) }, uSeal: o.seal || { value: new THREE.Vector4(0, -9999, 0, 0) },
      uMat: { value: new THREE.Vector4(o.under ? (o.underMix ?? 0.8) : 0, o.spec ?? 0.4, o.wet ?? 1, o.trans ?? 0) }, uTint: { value: new THREE.Color(o.tint || '#ffffff') },
      uFd: { value: new THREE.Vector3(...(o.fade || [34, 60, 0])) },
      uLk: { value: new THREE.Vector4(o.amb ?? 1, o.rim ?? 1, o.rimWide ?? 0, o.sheen ?? 0) } },
    vertexShader: PROP_VS, fragmentShader: PROP_FS, fog: true, side: THREE.DoubleSide,
  });
}

const lerpHex = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

// ---------------------------------------------------------------- 5. the world
export default {
  id: 'maelstrom-descent',
  name: 'The Descent',
  category: 'ocean',
  weirdness: 0.5,
  media: ['water'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const dens = vary.density ?? 1, rare = !!vary.rare;

    // ---------- 5a. seeded choices (the first draws of ctx.rng, in this order) ----------
    const w0 = rng(), c1 = rng(), c2 = rng(), c3 = rng(), c4 = rng();
    const weatherId = w0 < 0.3 ? 'fog' : w0 < 0.62 ? 'squall' : 'clear';
    const wreckKind = c1 < 0.5 ? 0 : c1 < 0.78 ? 1 : 2;              // dismasted hull | upturned whaleboat | fish racks
    const swimmerKind = c2 < 0.62 ? 0 : 1;                           // grey seal | two porpoises
    const fishKind = c3 < 0.45 ? 0 : c3 < 0.8 ? 1 : 2;               // cod | saithe | saithe with the herring ball close
    const birdId = c4 < 0.45 ? 'gulls' : c4 < 0.75 ? 'kittiwakes' : 'gannets';
    const hourId = HOURS[vary.hour] ? vary.hour : 'golden';
    const HR = HOURS[hourId], night = !!HR.night;
    // squall kind (no extra random draw: it is read off the weather draw itself): A slate, B iron with a cold pale band
    const sqB = weatherId === 'squall' && (w0 - 0.3) / 0.32 >= 0.5;
    const WX = sqB ? { ...WEATHERS.squall, ambK: 1.0, cover: 0.8, shade: [0.0050, -0.0026, 0.9, 0.05, 0.3], zenith: '#34465C', warm: '#AAB6B6', cool: '#526478', fogColor: '#66747E', cloudLit: '#9DB0C4', cloudShade: '#172A42' } : WEATHERS[weatherId];
    const WC = night ? {} : WX;                                      // weather colour overrides do not apply under the moon
    const sunDir = V3(Math.sin(120 * DEG) * Math.cos(HR.sunEl * DEG), Math.sin(HR.sunEl * DEG), -Math.cos(120 * DEG) * Math.cos(HR.sunEl * DEG));
    const sunTh = Math.atan2(sunDir.z, sunDir.x);
    const zenithHex = WC.zenith || HR.zenith, fogHex = WC.fogColor || HR.fog;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(fogHex, WX.fog * (night ? 0.8 : 1));
    const baseFog = scene.fog.density;

    // ---------- 5b. the hero: sea and funnel, at the origin ----------
    const pal = ['#0A2B2A', HR.bottle || '#1E5A4C', '#68A05C', HR.gold || '#F0B85A', '#2C4A66', HR.foam || '#EEE8D8', '#B8864C'];
    const heroOpts = { palette: pal, sunDir, sunColor: HR.sun, sunIntensity: HR.sunI * WX.sunK,
      ambient: new THREE.Color(HR.amb[0] * WX.ambK, HR.amb[1] * WX.ambK, HR.amb[2] * WX.ambK),
      zenith: zenithHex, horizonWarm: WC.warm || HR.warm, horizonCool: WC.cool || HR.cool, glow: HR.glow * WX.glowK, mist: mix(0.85, 1.1, vary.mood ?? 0.5), foam: mix(0.74, 0.9, vary.mood ?? 0.5), glowFall: 38, clear: 0.42,
      crossing: Math.PI - 0.0276 };      // where our route goes over the rim breaker (see 5c: the crest point at THC, crossed on a slant): the breaker has a saddle there
    if (HR.glowColor) heroOpts.glowColor = new THREE.Color(HR.glowColor).multiplyScalar(1.4);
    const hero = await buildHero(ctx, heroOpts);
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors, wallY = hero.wallY;
    U.uShade.value.set(WX.shade[0], WX.shade[1], 0, WX.shade[2]); U.uShadeE.value.set(WX.shade[3], WX.shade[4]);
    U.uFloor.value = 1 / (HR.exposure * (weatherId === 'fog' ? 1.04 : 1));      // the hero's dark floor is set for exposure 1 (the night's 1.45 would lift it to a pale teal)
    await ctx.yield();

    // ---------- 5c. PATH ----------
    const slopeAt = (r) => (r >= 300 || r < 55 ? 0 : (wallY(r + 0.25) - wallY(r - 0.25)) / 0.5);
    const eyeAt = (r, th, lift) => { const sl = slopeAt(r), l = Math.hypot(sl, 1); return V3(Math.cos(th) * (r - (sl / l) * lift), wallY(r) + lift / l, Math.sin(th) * (r - (sl / l) * lift)); };
    const LIFT = 2.7, THC = Math.PI - 0.03, NORTH = 1.5 * Math.PI;
    const HD = V3(Math.sin(35 * DEG), 0, -Math.cos(35 * DEG));              // run-in heading: compass 35
    const crest = V3(Math.cos(THC) * 301, 8.6, Math.sin(THC) * 301);
    const pts = [];
    for (const s of [0, 26, 52, 74, 90]) { const p = crest.clone().addScaledVector(HD, s - 100); p.y = 2.7 + 5.9 * sstep(322, 301, Math.hypot(p.x, p.z)); pts.push(p); }
    pts.push(crest.clone());
    for (let i = 1; i <= 8; i++) {                                         // the slide: r 300 -> 185 over one radian
      const f = i / 8, f2 = f * f, f3 = f2 * f;
      const r = (2 * f3 - 3 * f2 + 1) * 300 + (f3 - 2 * f2 + f) * -210 + (-2 * f3 + 3 * f2) * 185 + (f3 - f2) * -32;
      pts.push(eyeAt(r, THC + f, LIFT + 3.2 * (1 - f) * (1 - f) + 2.0 * Math.sin(Math.PI * f) ** 2));      // carried high on the swell through the first half of the slide (5.5 m): from there the eye sees over the brow of the wall into the pit
    }
    const TH_END = NORTH + TAU - 0.95, WT = TH_END - (THC + 1);
    for (let i = 1; i <= 30; i++) { const f = i / 30; pts.push(eyeAt(mix(185, 78, Math.pow(f, 0.92)), THC + 1 + WT * f, LIFT)); }   // the wall
    pts.push(eyeAt(71, NORTH + TAU - 0.66, 9), eyeAt(64, NORTH + TAU - 0.38, 14.5));
    const portalPos = A.portalSeat.position.clone(), diveDir = A.portalSeat.direction.clone();
    pts.push(A.diveStart.clone(), portalPos.clone().addScaledVector(diveDir, -31), portalPos.clone());
    const path = makePath(pts), LEN = path.length;
    await ctx.yield();
    // camera polar table: every staged pass is solved from it
    const NT = 600, tabR = new Float32Array(NT + 1), tabT = new Float32Array(NT + 1);
    { let prev = Math.atan2(pts[0].z, pts[0].x); if (prev < 0) prev += TAU; const p = V3();
      for (let i = 0; i <= NT; i++) { path.pointAt(i / NT, p); let th = Math.atan2(p.z, p.x); while (th < prev - Math.PI) th += TAU; while (th > prev + Math.PI) th -= TAU; prev = th; tabR[i] = Math.hypot(p.x, p.z); tabT[i] = th; } }
    const polarAt = (u, out) => { const x = sat(u) * NT, i = Math.min(NT - 1, Math.floor(x)), f = x - i; out.r = mix(tabR[i], tabR[i + 1], f); out.th = mix(tabT[i], tabT[i + 1], f); return out; };
    const uAtTheta = (th) => { for (let i = 60; i <= NT; i++) if (tabT[i] >= th) return i / NT; return 1; };
    const uG0 = uAtTheta(sunTh + TAU - 0.9), uG1 = uAtTheta(sunTh + TAU + 0.75);      // where we run along the glowing wall
    const fish0 = uG0, fish1 = uG1 + (rare ? 0.03 : 0);
    const uSeal = rare ? 0.672 : (uG0 + uG1) / 2 + 0.01;
    const U_WRECK = 0.43, U_PASS = 0.76;
    await ctx.yield();

    // ---------- 5d. sky, light, islands, rain ----------
    const cloudLit = WC.cloudLit || HR.cloudLit, cloudShade = WC.cloudShade || HR.cloudShade;
    const skyO = { rng, renderer: ctx.renderer, ...HR.sky,
      clouds: { coverage: WX.cover, softness: 0.3, scale: 1.25, stretch: 0.55, wind: [0.002, -0.011], lit: cloudLit, shade: cloudShade, silver: 1.2 } };
    if (!night) { skyO.sunElevation = HR.sunEl; skyO.sunAzimuth = 120; }
    if (weatherId === 'squall' && !night) {
      // slate cloud over a cold pale horizon; the only gold is the sun's own patch, a low narrow slot under the cloud on
      // the sun's side (kind A) and the slot of light that uShade sweeps across the water
      skyO.zenith = lerpHex(HR.sky.zenith, sqB ? '#1C2A40' : '#22344A', 0.86); skyO.mid = lerpHex(HR.sky.mid || HR.sky.horizon, sqB ? '#3F566E' : '#50667A', 0.86);
      skyO.horizon = lerpHex(HR.sky.horizon, sqB ? '#93A3A8' : '#7C8C98', 0.86); skyO.sunIntensity = (HR.sky.sunIntensity || 11) * 0.75;
      if (sqB) { skyO.scatterColor = '#9FB0B8'; skyO.scatter = 0.12; skyO.scatterPow = 5; skyO.veil = 0.55; }
      else { skyO.scatterColor = lerpHex(HR.gold || '#F0B85A', '#E8D2A0', 0.3); skyO.scatter = 0.4; skyO.scatterPow = 18; skyO.scatterHigh = 0; skyO.scatterFall = 9; skyO.veil = 0.3; }
      skyO.sunGlow = 0.3; skyO.clouds2 = false; skyO.cloudLightColor = '#AEC0D2';
      Object.assign(skyO.clouds, sqB ? { silver: 0.5, scale: 1.75, stretch: 0.12, softness: 0.4, absorb: 2.2 } : { silver: 0.6, scale: 1.2, stretch: 0.3, softness: 0.34, absorb: 2.0 });
    }
    if (weatherId !== 'squall' && !night) {
      // not a clear evening: broken storm cloud with body and depth (dark bellies, lit edges, gaps of sky) over the gold
      // band of the low sun, and a higher grey veil behind it. The sparse small clouds this replaces read as smudges.
      Object.assign(skyO.clouds, { softness: 0.4, scale: 1.7, stretch: 0.12, absorb: 1.55, silver: 1.0, detail: 0.7, haze: 0.26, lit: lerpHex(cloudLit, '#8E9698', 0.7), shade: lerpHex(cloudShade, '#8C929C', 0.5) });      // grey storm cloud: the gold is the sun's scatter on it, not its own colour
      skyO.clouds2 = { coverage: 0.78, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 0.5, lit: lerpHex(cloudLit, '#93A2AA', 0.55), shade: lerpHex(cloudShade, '#5A6E80', 0.5), wind: [0.004, -0.006] };
      // golden hour: the gold is the sun's own quarter of the horizon, the rest is cool and pale (it was one beige all round)
      if (hourId === 'golden') { skyO.zenith = '#34587E'; skyO.mid = '#7FA2A8'; skyO.horizon = '#D9CBA8'; skyO.scatter = 0.85; skyO.scatterPow = 4.5; }
    }
    if (weatherId === 'fog') { skyO.zenith = lerpHex(skyO.zenith || HR.sky.zenith || '#0a1226', fogHex, night ? 0.55 : 0.25); skyO.mid = lerpHex(skyO.mid || HR.sky.mid || HR.sky.horizon || '#152e5a', fogHex, night ? 0.75 : 0.5); skyO.horizon = lerpHex(skyO.horizon || HR.sky.horizon || '#152e5a', fogHex, 0.85); if (!night) { skyO.sunIntensity = (HR.sky.sunIntensity || 11) * 0.7; skyO.sunGlow = 1.1; } else skyO.clouds2 = false; }
    const sky = makeSky(skyO);
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.4 });          // 2 lights: they light the ride; everything else is self-shaded
    scene.add(rig.object);
    await ctx.yield();
    // the storm over the maelstrom: the shelf (own shader, one draw call) and, standing round the horizon below it, a
    // wall of cumulus towers 1.1 - 1.4 km off (kit cloud field, one draw call), left open toward the sun. Their random
    // numbers come from a generator of their own, so nothing else in the seed moves.
    const shelfK = weatherId === 'fog' ? 0.92 : WX.rain ? 0.8 : 0.94;
    const shelfU = { ...U, uLitC: { value: new THREE.Color(cloudLit).multiplyScalar(night ? 0.5 : 0.95) }, uShadeC: { value: new THREE.Color(cloudShade).lerp(new THREE.Color('#6A7C8C'), night ? 0.1 : 0.3) },
      // clear weather: the shelf's bars reach round to within 30 degrees of the sun (two slate bars with lit edges cross the
      // sky ahead on the sunward wall, which was an empty beige quarter) and keep their colour further out
      uSlot: { value: new THREE.Vector2(WX.rain ? 0.3 : 0.66, WX.rain ? 0.92 : 0.985) },
      uShelf: { value: new THREE.Vector4(shelfK, weatherId === 'fog' ? 2800 : WX.rain ? 2200 : 4300, 0, 760) } };
    const shelfGeo = new THREE.CircleGeometry(4350, 48); shelfGeo.rotateX(Math.PI / 2);
    const shelf = new THREE.Mesh(shelfGeo, new THREE.ShaderMaterial({ uniforms: shelfU, vertexShader: SHELF_VS, fragmentShader: SHELF_FS, side: THREE.DoubleSide, ...PREMUL }));
    shelf.position.y = 520; shelf.renderOrder = 0.5; shelf.frustumCulled = false; shelf.name = 'storm-shelf'; scene.add(shelf);
    await ctx.yield();
    let towers = null;
    if (weatherId !== 'fog') {
      const tr = ctx.core.makeRng('maelstrom-towers:' + ctx.seed), at = [], nT = 9;
      for (let k = 0; k < nT; k++) { const a = sunTh + 0.8 + (k + tr.range(-0.3, 0.3)) * ((TAU - 1.6) / (nT - 1)), R = tr.range(1080, 1420); at.push([Math.cos(a) * R, tr.range(70, 150), Math.sin(a) * R, tr.range(380, 620)]); }
      towers = makeCloudField({ rng: tr, sky, at, height: 0.85, puffs: 44, wind: [0.5, 0, -1.2], farFade: [3600, 4600], fogFade: 0.3, opacity: 0.92, silver: 1.2 });
      scene.add(towers.object);
    }
    await ctx.yield();
    // bars of stratocumulus lying across the sun's quarter (fog weather only: it has no cumulus towers and its sky was one
    // flat beige; the other weathers keep the sky they had): one mesh, one
    // draw call, their numbers from a generator of their own. They drift north.
    let bars = null;
    if (weatherId === 'fog') {
      const br = ctx.core.makeRng('maelstrom-bars:' + ctx.seed), pos = [], ab = [], idx = [], nu = 14;
      // [bearing from the sun (rad), elevation seen from the axis (rad), range, length, width]
      const SPEC = [[0.66, 0.22, 2600, 2500, 420], [0.36, 0.37, 2050, 1700, 330], [-0.1, 0.3, 2850, 2700, 430], [-0.52, 0.2, 2500, 2100, 360], [0.95, 0.47, 1900, 1500, 300], [0.12, 0.52, 1700, 1200, 260]];
      SPEC.forEach(([dAz, el, R, L, w], k) => {
        const az = sunTh + dAz + br.range(-0.06, 0.06), H = R * Math.tan(el + br.range(-0.02, 0.02)), half = (L * br.range(0.85, 1.15)) / (2 * R), seed = br(), slant = br.range(-70, 70), base = pos.length / 3;
        for (let i = 0; i <= nu; i++) { const fu = (i / nu) * 2 - 1, a = az + fu * half, ww = w * (0.75 + 0.5 * Math.sin(i * 1.7 + seed * 9) * 0.5 + 0.25);
          for (const v of [-1, 1]) { const r = R + v * ww * 0.5; pos.push(Math.cos(a) * r, H + fu * slant - v * ww * 0.5 * 0.5, Math.sin(a) * r); ab.push(fu, v, seed, k < 4 ? 0.94 : 0.8); } }      // tilted to face us (its far edge lower): we see its belly, not its edge
        for (let i = 0; i < nu; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('aBar', new THREE.Float32BufferAttribute(ab, 4)); bg.setIndex(idx);
      bars = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: { ...U, uLitC: { value: new THREE.Color(cloudLit).multiplyScalar(night ? 0.55 : 1.0) }, uShadeC: { value: new THREE.Color(cloudShade).lerp(new THREE.Color(fogHex), night ? 0.15 : 0.42) } },
        vertexShader: BAR_VS, fragmentShader: BAR_FS, side: THREE.DoubleSide, ...PREMUL }));
      bars.renderOrder = 0.6; bars.frustumCulled = false; bars.name = 'cloud-bars'; scene.add(bars);
    }
    await ctx.yield();
    let ridges = null;
    if (WX.islands && !HR.noIslands) {
      ridges = makeHorizonRidges({ rng: rng.fork('isles'), layers: 3, radius: [3650, 4700], height: [230, 470], base: -20, segments: 220, jagged: 0.85, coverage: 0.52, fog: scene.fog,
        sunDir, sunColor: HR.sun, sunIntensity: night ? 0.5 : 1, snow: true, snowLine: 0.86, rim: 0.35 });
      // sink the ring toward the sun: the teeth stand north and west, the sunward horizon stays open
      const P = ridges.object.geometry ? ridges.object.geometry.attributes.position : null;
      if (P) { for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > 0) P.setY(i, y * mix(0.08, 1, sstep(0.8, 0.15, Math.cos(Math.atan2(P.getZ(i), P.getX(i)) - sunTh)))); } P.needsUpdate = true; }
      scene.add(ridges.object);
    }
    await ctx.yield();
    let rain = null, rainMat = null;
    if (WX.rain) {
      const S = [], n = 7;
      for (let k = 0; k < n; k++) { const a = sunTh + Math.PI + (k - 3) * 0.52 + rng.range(-0.1, 0.1), R = rng.range(1000, 1900), w = rng.range(520, 900), h = rng.range(420, 560);
        const g = new THREE.PlaneGeometry(w, h, 1, 1); g.translate(0, h / 2 - 6, 0); g.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, rng.range(0.15, 0.35), 0, 0, 0)); g.rotateY(-a + Math.PI / 2); g.translate(Math.cos(a) * R, 0, Math.sin(a) * R); S.push(g); }
      const pos = [], uv = [], idx = [];
      S.forEach((g, k) => { pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); for (const i of g.index.array) idx.push(i + k * 4); g.dispose(); });
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx);
      rainMat = new THREE.ShaderMaterial({ uniforms: { uNoise: U.uNoise, uTime: U.uTime, uRainCol: { value: new THREE.Color(night ? '#0E1624' : '#3A4854') } }, vertexShader: RAIN_VS, fragmentShader: RAIN_FS, side: THREE.DoubleSide, ...PREMUL });
      rain = new THREE.Mesh(rg, rainMat); rain.renderOrder = 12; rain.frustumCulled = false; scene.add(rain);
    }
    await ctx.yield();

    // ---------- placement on the moving water ----------
    const D = new THREE.Object3D(), ONE = V3(1, 1, 1), _p = V3(), _n = V3(), _tT = V3(), _X = V3(), _Y = V3(), _Z = V3(), _lp = V3(), _lt = V3();
    const _m = new THREE.Matrix4(), _mb = new THREE.Matrix4(), _ml = new THREE.Matrix4(), _r1 = new THREE.Matrix4(), _r2 = new THREE.Matrix4(), _mf = new THREE.Matrix4();
    const _q = new THREE.Quaternion(), _e = new THREE.Euler(), pol = { r: 0, th: 0 };
    // seat D on the water at polar (r, th), heading = the flow direction turned `yaw` to starboard (inward)
    function seat(r, th, yaw = 0, lift = 0, roll = 0, pitch = 0) {
      hero.surfaceAt(Math.max(r, 56), th, undefined, _p, _n);
      _tT.set(-Math.sin(th), 0, Math.cos(th));
      _X.copy(_tT).applyAxisAngle(_n, -yaw); _Z.crossVectors(_X, _n);
      D.quaternion.setFromRotationMatrix(_m.makeBasis(_X, _n, _Z));
      if (roll || pitch) D.quaternion.multiply(_q.setFromEuler(_e.set(roll, 0, pitch)));
      D.position.copy(_p).addScaledVector(_n, lift); D.scale.copy(ONE);
      return D;
    }
    const applyTo = (obj) => { obj.position.copy(D.position); obj.quaternion.copy(D.quaternion); };
    // a point `depth` metres inside the still wall at polar (r, th); _n = the wall normal there
    function underPoint(r, th, depth, out) {
      const sl = slopeAt(r), l = Math.hypot(sl, 1), c = Math.cos(th), s = Math.sin(th);
      _n.set((-sl * c) / l, 1 / l, (-sl * s) / l);
      return out.set(c * r, wallY(r), s * r).addScaledVector(_n, -depth);
    }
    const yawOf = (dir, th) => Math.atan2(-(dir.x * Math.cos(th) + dir.z * Math.sin(th)), -dir.x * Math.sin(th) + dir.z * Math.cos(th));

    // ---------- 5e. boats ----------
    const matBoat = propMaterial(U, { wig: [0.1, 3.0, 0.8, 1], spec: 0.45, wet: 1, trans: 1 });
    const matPlain = propMaterial(U, { spec: 0.45, wet: 1 });
    const matWreck = propMaterial(U, { wig: [0.09, 4.2, 1.1, 1], spec: 0.5, wet: 1, amb: 0.62, rim: 3.6, rimWide: 1 });   // dark against the lit wall, a gold edge toward the sun
    const matKeel = propMaterial(U, { wig: [0.09, 4.2, 1.1, 1], spec: 0.7, wet: 1, amb: 0.62, rim: 0.8 });   // keel-up bottoms face the sky and the sun's glare: no broad back-light lobe, or they bleach
    const Y = () => ctx.yield();
    const boatG = await boatGeo(1, Y);
    await ctx.yield();
    const matBoat2 = propMaterial(U, { wig: [0.1, 3.0, 0.8, 1], spec: 0.45, wet: 1, trans: 0.8, tint: '#E2D8CA' });      // the second boat: the leader's dark hull and tan cloth, a shade paler
    const matBoat3 = propMaterial(U, { wig: [0.1, 3.0, 0.8, 1], spec: 0.45, wet: 0.22, trans: 0.5, tint: '#F2E8DA', amb: 1.9 });      // wet 0.22: seen from above, the inside of its hull under the waterline took the sea's colour (teal patches through the timber)   // the boat on the lip rides in the pit's shade: more fill, and the ring's light from below
    const leader = new THREE.Mesh(boatG, matBoat), boat2 = new THREE.Mesh(boatG, matBoat2), boat3 = new THREE.Mesh(boatG, matBoat3);
    scene.add(leader, boat2, boat3);
    await ctx.yield();
    const gapAt = (u) => (u < 0.1 ? 30 + 60 * u : u < 0.58 ? mix(36, 48, sstep(0.3, 0.5, u)) : 48 - (48 * (u - 0.58)) / (U_PASS - 0.58));      // 30 m ahead at the entry (its sail a fifth of the frame), 36 on the slide, 48 by the glass
    const bump = (rr) => sstep(315, 303, rr) * (1 - sstep(300.5, 295.5, rr));       // the rim breaker, which surfaceAt leaves out
    function placeLeader(u, time) {
      const sRaw = u * LEN + gapAt(u), s = Math.min(sRaw, 0.865 * LEN);
      path.posAtDist(s, _lp); path.tangentAtDist(s, _lt);
      let r = Math.hypot(_lp.x, _lp.z), th = Math.atan2(_lp.z, _lp.x);
      const yaw = yawOf(_lt, th);
      // on the slide it is carried down the wall faster than we are: 15 m inward of our line from u 0.18 to 0.24 (it stands
      // between us and the pit, inside the frame when the gaze goes to the far lip), back on our line by u 0.38
      // (and 9 m further up the wall while we overhaul the wreck, u 0.36 - 0.48: it stands clear to the left of the wreck's bow, a hull-length of water between them)
      r += 8.5 * sstep(0.3, 0.6, u) - 15 * sstep(0.105, 0.18, u) * (1 - sstep(0.24, 0.38, u)) + 9 * bell(u, 0.33, 0.51, 0.07); th += (Math.max(0, sRaw - s) / Math.max(r, 60)) * 0.75;
      const pitch = Math.atan(((bump(r - 2.5) - bump(r + 2.5)) * 4.6 / 5) * Math.sin(Math.max(yaw, 0.2))) + 0.03 * Math.sin(time * 1.3);
      seat(r, th, yaw, 4.6 * bump(r) + 0.05, 0.14 + 0.05 * Math.sin(time * 0.8), pitch); applyTo(leader);
      hero.setWake(1, leader.position, 4.2, 1);
    }
    // THE SECOND BOAT: THE CLOSE PASS AT u 0.50 - 0.66. It rides high on the wall (r 240) ahead of us all the way in, is
    // carried down the wall from u 0.3, and from u 0.5 heels on the slope 9.5 m up the wall to port, 21 m ahead closing
    // to 16 (u 0.62): seen from its quarter, above the shoal. Then it loses way and falls astern before we come up on the
    // leader. b2Ahead = metres ahead of the eye along our own track; before u 0.53 its place is integrated backward at
    // 23 m/s, so it never moves faster than a boat can.
    const b2Ahead = (u) => 21 - 45 * (u - 0.52) - 6860 * Math.max(0, Math.min(u, 0.65) - 0.6) ** 2 - 690 * Math.max(0, u - 0.65);      // (from u 0.6 it loses way at up to 15 m/s: abeam and out of the frame by u 0.65, where it used to sit cut in half by the top and left edges)
    const B2U = 0.53, b2R = new Float32Array(NT + 1), b2T = new Float32Array(NT + 1);
    { let rB = 240, thB = 0;
      for (let i = NT; i >= 0; i--) { const u = i / NT;
        if (u >= B2U) { polarAt(u + b2Ahead(u) / LEN, pol); rB = pol.r + 9.5 / Math.hypot(slopeAt(pol.r), 1); b2R[i] = rB; b2T[i] = thB = pol.th; }
        else { b2R[i] = mix(240, rB, sstep(0.3, B2U, u)); b2T[i] = thB -= (23 / b2R[i]) * (DUR / NT); } } }
    const b2Polar = (u, out) => { const x = sat(u) * NT, i = Math.min(NT - 1, Math.floor(x)), f = x - i; out.r = mix(b2R[i], b2R[i + 1], f); out.th = mix(b2T[i], b2T[i + 1], f); return out; };
    const pol2 = { r: 0, th: 0 }, pol2b = { r: 0, th: 0 };
    function placeBoat2(u, time) {
      b2Polar(u, pol2); b2Polar(u + 0.004, pol2b);
      const yaw = Math.atan2((pol2.r - pol2b.r) / (0.004 * DUR), 23) * 0.8;      // its bow follows its course down the wall
      seat(pol2.r, pol2.th, yaw, 0.05, 0.13 + 0.04 * Math.sin(time * 0.7 + 2), 0.03 * Math.sin(time * 1.1)); applyTo(boat2);
      boat2.scale.setScalar(Math.max(sstep(0.09, 0.14, u), 1e-3));      // (not behind the leader's sail in the opening frames, where it would be a 9 px tick 230 m off)
      if (u < 0.77) hero.setWake(3, u > 0.1 && u < 0.75 ? boat2.position : null, 4.2, 1);      // (slots 3 - 7 belong to the wreckage of the lip pass from u 0.775)
    }
    // THE THIRD BOAT, ON THE LIP (u 0.66 - 0.86): a larger boat going round the lip of the throat ahead and below us, to
    // the left of the sight line to the ring (it never crosses it: the water there carries it leftward across our view).
    // At u 0.8 the lip takes it: it heels inward, slides over and is gone into the collar's mist by u 0.84, before we
    // follow. It is not drawn from further than ~150 m (a dark tick on the pit's edge).
    const b3Th0 = polarAt(0.79, pol).th + 0.45;
    function placeBoat3(u, time, camPos) {
      const th = b3Th0 + 0.29 * DUR * (u - 0.79), fall = sstep(0.792, 0.845, u), f2 = fall * fall;
      seat(63 - 6 * fall, th, 0.12 + 0.5 * fall, 0.05, 0.4 + 0.7 * fall + 0.05 * Math.sin(time * 0.8 + 1), 0.04 * Math.sin(time * 1.2) - 0.25 * fall);      // heeled 23 degrees toward the throat on top of the wall's own slope
      D.position.x -= Math.cos(th) * 13 * f2; D.position.z -= Math.sin(th) * 13 * f2; D.position.y -= 24 * f2;
      applyTo(boat3);
      const on = sstep(0.6, 0.66, u) * (1 - sstep(0.812, 0.838, u)) * (1 - sstep(125, 165, D.position.distanceTo(camPos)));      // (gone under the collar before the ring's glare makes an orange block of it)
      boat3.scale.setScalar(Math.max(1.35 * on, 1e-3));
      if (u >= 0.66) hero.setWake(2, on > 0.05 && fall < 0.6 ? boat3.position : null, 5.4 * on, 1.3, null, 0.6);      // (slot 2 was the wreck's: it is far astern by now)
    }
    const rowDef = await rowboatGeo(Y), rowers = [], oars = new THREE.InstancedMesh(oarGeo(), matPlain, 18);
    oars.frustumCulled = false; scene.add(oars);
    await ctx.yield();
    const LEFT = V3(HD.z, 0, -HD.x), rowDir = V3().addScaledVector(LEFT, 0.85).addScaledVector(HD, 0.3).normalize();
    const rowBase = [[42, 27], [64, 44], [87, 33]].map(([s, d]) => crest.clone().addScaledVector(HD, s - 100).addScaledVector(LEFT, d));
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(rowDef.geo, matPlain); rowers.push(m); scene.add(m); }
    await ctx.yield();
    function placeRowers(u, time) {
      for (let i = 0; i < 3; i++) {
        const b = rowBase[i], adv = 1.0 * u * DUR + 0.5 * Math.sin(time * 0.5 + i * 2.1);
        const x = b.x + rowDir.x * adv, z = b.z + rowDir.z * adv, r = Math.hypot(x, z), th = Math.atan2(z, x);
        seat(r, th, yawOf(rowDir, th), 0.02, 0.07 * Math.sin(time * 1.1 + i * 1.7), 0.05 * Math.sin(time * 0.9 + i * 2.3)); applyTo(rowers[i]);
        if (u < 0.34) hero.setWake(4 + i, D.position, 2.7, 0.9);      // (from u 0.36 these three slots belong to the yard and two barrels)
        _mb.compose(D.position, D.quaternion, ONE);
        const ph = time * 3.6 + i * 1.3, a = 0.55 * Math.sin(ph), dip = 0.2 + 0.17 * Math.cos(ph);
        for (let k = 0; k < rowDef.locks.length; k++) {
          const lx = rowDef.locks[k][0], ly = rowDef.locks[k][1];
          const zb = 1.05 * Math.pow(1 - Math.pow(Math.abs(2 * lx / 8), 2.3), 0.55) + 0.03;
          _ml.makeTranslation(lx, ly, zb).multiply(_r1.makeRotationY(a)).multiply(_r2.makeRotationX(dip));
          oars.setMatrixAt(i * 6 + k * 2, _mf.multiplyMatrices(_mb, _ml));
          _ml.makeTranslation(lx, ly, -zb).multiply(_r1.makeRotationX(Math.PI)).multiply(_r2.makeRotationY(a)).multiply(_r1.makeRotationX(-dip));
          oars.setMatrixAt(i * 6 + k * 2 + 1, _mf.multiplyMatrices(_mb, _ml));
        }
      }
      oars.instanceMatrix.needsUpdate = true;
    }

    // ---------- 5f. wreckage orbiting the wall: every piece is solved backward from where it meets us ----------
    const orbiters = [];
    // o.u = where it is met: `off` m to starboard of our track (negative: to port) and `ahead` m ahead of the eye at that
    // moment. o.drift: it spirals inward at our own rate for d0 s before and d1 s after the meeting, so the gap between
    // it and our track stays `off` for the whole pass (our route closes on any fixed orbit by 3 m every second).
    const addOrb = (o) => { polarAt(o.u, pol); const sl = slopeAt(pol.r); o.r = pol.r - o.off / Math.hypot(sl, 1); o.th0 = pol.th + (o.ahead || 0) / o.r; o.om = hero.angularSpeed(o.r) * (o.k ?? 0.96); o.ph = orbiters.length * 1.7;
      if (o.drift) { const ra = polarAt(o.u - 0.01, pol).r; o.vr = (ra - polarAt(o.u + 0.01, pol).r) / (0.02 * DUR); }
      orbiters.push(o); return o; };
    const orbR = (o, du) => (o.vr ? o.r - o.vr * Math.max(-o.drift[0], Math.min(o.drift[1], du)) : o.r);
    // the wreck: 9.5 m ahead and 6.8 m off at u 0.43, the stove side toward us and heeled our way; it is carried a little
    // faster than the foam (k 1.2), so the overhaul lasts from u 0.38 to 0.46
    const wreckSpec = [{ off: 6.8, ahead: 9.5, k: 1.2, yaw: Math.PI - 0.25, lift: 0.05, roll: 0.1, wake: 3.6, wakeK: 0.6, contact: 0.4 }, { off: 6.8, ahead: 7, k: 1.15, yaw: 0.35, lift: -0.02, roll: 0.07, wake: 2.2, wakeK: 0.4, contact: 0.45 }, { off: 8.2, ahead: 8, k: 1.15, yaw: 0.5, lift: -0.02, roll: 0.05, wake: 3.4, wakeK: 0.6, contact: 0.45 }][wreckKind];
    const wreck = new THREE.Mesh(await wreckGeo(wreckKind, rng, Y), wreckKind === 1 ? matKeel : matWreck); scene.add(wreck);
    const wreckOrb = addOrb({ obj: wreck, u: U_WRECK, off: wreckSpec.off, ahead: wreckSpec.ahead, k: wreckSpec.k, drift: [4.5, 3.5], yaw: wreckSpec.yaw, yawRate: TAU / 20, lift: wreckSpec.lift, roll: wreckSpec.roll, wake: 2, wakeR: wreckSpec.wake, wakeK: wreckSpec.wakeK ?? 1, contact: wreckSpec.contact ?? 0.6, wakeTo: 0.64 });
    await ctx.yield();
    const skiff = new THREE.Mesh(skiffGeo(), matKeel); scene.add(skiff);
    await ctx.yield();
    addOrb({ obj: skiff, u: 0.31, off: 6.6, yaw: 0.8, yawRate: TAU / 14, lift: -0.05, roll: 0.1, wake: 7, wakeR: 2.2, wakeTo: 0.4 });
    const yard = new THREE.Mesh(yardGeo(), matBoat); scene.add(yard);      // matBoat: its rag is sailcloth
    await ctx.yield();
    // THE PASS AT u 0.52: the yard with its rag of sail and three barrels ride 5 - 10 m off the starboard bow from u 0.49
    // to 0.55. Like the wreck they are solved to be AHEAD of us at the meeting (abeam, they were out of the frame the
    // whole time they were near), drift inward with us so the gap holds, and are carried faster than the foam (k 1.21 -
    // 1.25: we overhaul them at 4.5 m/s), each with its own wake (slots 4 - 7, free once the rowers and the skiff are astern).
    const U_YARD = 0.52;
    const yardOrb = addOrb({ obj: yard, u: U_YARD, off: 8.4, ahead: 10.5, k: 1.225, drift: [3, 2.5], yaw: -0.84, yawRate: 0.06,      /* broadside to the eye, the cloth bellying away from us */ lift: 0.04, roll: 0, wake: 4, wakeR: 2.6, wakeK: 1.5, contact: 0.5, wakeFrom: 0.36, wakeTo: 0.74 });
    const floats = new THREE.Mesh(floatsGeo(), matPlain); scene.add(floats);
    await ctx.yield();
    addOrb({ obj: floats, u: 0.585, off: 6.6, yaw: 0.05, yawRate: 0.02, lift: 0.0, roll: 0, k: 0.99 });   // met before the gaze turns to the ring (u 0.67): nothing of ours floats in front of it
    // barrels: wet and dark, a gold rim toward the sun (their own material: the wreck's look, glossier)
    const matBarrel = propMaterial(U, { spec: 0.95, wet: 1, amb: WX.rain ? 1.9 : 1.3, rim: 3.2, rimWide: 1, sheen: WX.rain ? 1.6 : 1, tint: '#b8b0a4' });      // more sky fill under the squall: in iron light they were dark blocks
    const nBar = 8, barrels = new THREE.InstancedMesh(barrelGeo(), matBarrel, nBar + 2); barrels.frustumCulled = false; scene.add(barrels);      // (+2: the two barrels of the lip pass, placed by placeLipWreck)
    const HEROB = { 0: { off: 6.4, ahead: 11.5, k: 1.235, wake: 5 }, 1: { off: 7.8, ahead: 16.5, k: 1.25, wake: 6 }, 3: { off: 10.4, ahead: 20.5, k: 1.21, wake: 7 } };      // the three that ride with the yard: true scale (0.85 m) and 13 m or more off, so no barrel is ever bigger in the frame than a boat's crew
    for (let i = 0; i < nBar; i++) { const hb = HEROB[i], o = { inst: barrels, i, u: 0.47 + 0.012 * i + (i > 5 ? 0.05 : 0), off: [6.6, 8.4, -6.8, 7.2, 9.6, -8.2, 7.4, 8.8][i], yaw: rng.range(0, TAU), yawRate: rng.range(-0.3, 0.3), lift: 0.1, roll: 0, spin: rng.range(0.7, 1.8) * (i % 2 ? 1 : -1), k: rng.range(0.9, 1) };
      if (hb) Object.assign(o, { u: U_YARD, off: hb.off, ahead: hb.ahead, k: hb.k, drift: [3, 2.5], lift: 0.12, spin: o.spin * 0.45, wake: hb.wake, wakeR: 0.85, wakeK: 1.6, contact: 0.55, wakeFrom: i === 3 ? 0.42 : 0.36, wakeTo: 0.74 });
      // the two nearest lie three-quarter on to the eye at the pass, one pale round head toward us (end-on to the flow they were dark blocks)
      if (hb && i < 2) Object.assign(o, { yaw: Math.PI + Math.atan2(hb.off, hb.ahead) + (i ? 0.6 : -0.6), yawRate: i ? -0.05 : 0.05 });
      addOrb(o); }
    await ctx.yield();
    // Small wreckage draws in to nothing between 55 and 95 m from the eye (the wreck itself stays: it is a ship at any
    // range): on the far wall a wet spar or a line of floats is a pixel-thin black dash, not a thing.
    function placeOrbiters(u, time, camPos) {
      for (const o of orbiters) {
        const du = (u - o.u) * DUR;
        seat(orbR(o, du), o.th0 + o.om * du, o.yaw + (o.yawRate || 0) * du + 0.05 * Math.sin(time * 0.7 + o.ph), o.lift + 0.05 * Math.sin(time * 1.3 + o.ph),
          o.roll + (o.spin ? o.spin * time : 0) + 0.05 * Math.sin(time * 0.9 + o.ph), 0.04 * Math.sin(time * 1.1 + o.ph * 2));
        // nothing afloat is drawn where it would be a dark tick: small wreckage goes under between 46 and 78 m from the
        // eye, the wreck itself between 105 and 150 m (a 14 m hull 150 m off is a 30 pixel black dash on the far wall)
        const dC = D.position.distanceTo(camPos), near = Math.max(o === wreckOrb ? 1 - sstep(105, 150, dC) : 1 - sstep(46, 78, dC), 1e-3);
        if (o.wake !== undefined && u >= (o.wakeFrom ?? 0)) { if (u < (o.wakeTo ?? 2)) hero.setWake(o.wake, near > 0.05 ? D.position : null, o.wakeR * near, o.wakeK ?? 1, null, o.contact ?? 1); else if (u < o.wakeTo + 0.02) hero.setWake(o.wake, null, 0); }
        if (o.obj) { applyTo(o.obj); o.obj.scale.setScalar(near); }
        else { D.scale.setScalar((o.sc || 1) * near); D.updateMatrix(); o.inst.setMatrixAt(o.i, D.matrix); }
      }
      barrels.instanceMatrix.needsUpdate = true;
    }
    await ctx.yield();
    // THE LIP PASS (u 0.80 - 0.92): the last of the wreckage rides down the foot of the wall off our starboard bow as we
    // come to the brow: a keel-up hull (the skiff's, at 1.7: 7.8 m) 11 m off, rolled toward us and rocking, a barrel
    // beside it, a yard with its rag of sail 19 m off, a second barrel. We overhaul them from u 0.795 (6.5 m/s, in from
    // the lower left of the frame), they keep pace with us from u 0.84 to 0.874 (the water down there is as fast as we
    // are: the stills at u 0.84 - 0.88), then they slide to the brow, tumble and go over it (u 0.895 - 0.92) ahead of
    // us and to the left of the ring (never across it). Placed from polarAt(u) every frame: `off` m down the wall from our track,
    // `ahead` m along it. Wakes: slots 3 - 6 (free by then: the second boat, the yard and its barrels are far astern).
    const skiff2 = new THREE.Mesh(skiff.geometry, matKeel), yard2 = new THREE.Mesh(yard.geometry, matBoat); scene.add(skiff2, yard2);
    const LIPW = [
      { obj: skiff2, sc: 1.7, off: 7.8, ahead: 6.0, yaw: 0.3, lift: 0.25, roll: -0.75, rock: 0.22, tum: 1, wake: 3, wakeR: 3.8, late: 0 },      // (rolled on its side toward us, rocking: flat on the water it was a brown slab seen edge on)
      { obj: yard2, sc: 1, off: 13.5, ahead: 12, yaw: 0.22, lift: 0.04, roll: -0.3, rock: 0.1, tum: 0.5, wake: 4, wakeR: 2.6, late: 0.007 },
      { i: nBar, off: 5.4, ahead: 4, yaw: 2.2, lift: 0.12, roll: 0, rock: 0.06, spin: 1.1, tum: 0.3, wake: 5, wakeR: 0.85, late: -0.004 },
      { i: nBar + 1, off: 11.5, ahead: 15, yaw: 0.7, lift: 0.12, roll: 0, rock: 0.06, spin: -0.8, tum: 0.3, wake: 6, wakeR: 0.85, late: 0.004 }];
    function placeLipWreck(u, time) {
      polarAt(u, pol); const cr = pol.r, cth = pol.th, hyp = Math.hypot(slopeAt(Math.max(cr, 60)), 1);
      for (let k = 0; k < LIPW.length; k++) {
        const o = LIPW[k], ul = u - o.late, slide = sstep(0.874, 0.912, ul), over = sstep(0.895, 0.922, ul), o2 = over * over;
        const r = Math.max(56, cr - (o.off + 33 * slide) / hyp), th = cth + (o.ahead + 300 * Math.max(0, 0.84 - u) + 9 * slide) / Math.max(r, 60);
        seat(r, th, o.yaw + 0.05 * Math.sin(time * 0.7 + k) + o.tum * 1.1 * slide, o.lift + 0.05 * Math.sin(time * 1.3 + k * 2),
          o.roll + (o.spin ? o.spin * time : 0) + o.rock * Math.sin(time * 0.9 + k) + o.tum * 2.6 * slide * slide, 0.04 * Math.sin(time * 1.1 + k) - o.tum * 1.1 * over);
        // over the brow: it pitches in and drops down the throat
        D.position.x -= Math.cos(th) * 8 * o2; D.position.z -= Math.sin(th) * 8 * o2; D.position.y -= 20 * o2;
        const on = Math.max(sstep(0.795, 0.822, u) * (1 - sstep(0.55, 1, over)), 1e-3);      // (they draw in after u 0.795: the still at 0.79 is the boat on the lip alone)
        if (u >= 0.775) hero.setWake(o.wake, on > 0.05 && over < 0.4 ? D.position : null, o.wakeR * on, 1.5 + 0.8 * slide, null, 0.55);
        if (o.obj) { applyTo(o.obj); o.obj.scale.setScalar(o.sc * on); }
        else { D.scale.setScalar(on); D.updateMatrix(); barrels.setMatrixAt(o.i, D.matrix); }
      }
      barrels.instanceMatrix.needsUpdate = true; D.scale.copy(ONE);
    }
    await ctx.yield();

    // ---------- 5g. the glass: things hanging in the lit water of the sunward wall ----------
    const sealU = { value: new THREE.Vector4(0, -9999, 0, 1) };
    const matFish = propMaterial(U, { under: true, underMix: weatherId === 'fog' ? 0.28 : 0.45, wig: [0.085, 7.5, 5.5, 0], spec: 0.9, wet: 0, seal: sealU, tint: weatherId === 'fog' ? '#3B3B3B' : '#484848', fade: [22, 38, 1] });      // dark shapes; none drawn smaller than ~30 px or flat to the surface
    const matKelp = propMaterial(U, { under: true, wig: [0.2, 2.3, 2.2, 2], spec: 0.3, wet: 0 });
    // dark shapes inside lit glass: the seal's slate back is near black against the glow, only its throat and chest are pale
    const matSwim = propMaterial(U, swimmerKind ? { under: true, underMix: 0.15, wig: [0.04, 4.2, 4.5, 2], spec: 0.8, wet: 0, tint: '#ffffff' }      // porpoises: dark wet backs (pale grey, awash, they were ghosts of fish)
      : { under: true, underMix: 0.3, wig: [0.035, 3.4, 4.5, 0], spec: 0, wet: 0, tint: '#c8c8c8' });   // no sun glint: in the glass it read as a gold fish lying on the seal
    const UP = V3(0, 1, 0), fr = rng.fork('shoal');
    const nFish = 300, shoal = new THREE.InstancedMesh(fishGeo(fishKind ? 1 : 0), matFish, nFish);
    await ctx.yield();
    for (let k = 0; k < nFish; k++) {
      const fa = fr(), fb = fr(), fc = fr();      // (three draws, as before) the shoal is thickest two thirds of the way along the glass and still thick at its end
      const uF = mix(fish0, fish1 + 0.012, Math.pow((fa + fb) / 2, 0.72) + 0.06 * (fc - 0.5)), turn = (hash(Math.floor(uF * 70) * 3.3) > 0.5 ? 1 : -1) * fr.range(0.5, 1.05);
      polarAt(uF, pol);
      // under the track and to port of it; every third fish is one of the big near ones, close under the surface by the bow
      const sl = slopeAt(pol.r), near = k % 3 === 0, dPort = near ? 0.5 + 8.5 * fr() : -1 + 12 * Math.pow(fr(), 1.3), th = pol.th + fr.range(-0.012, 0.012);
      underPoint(pol.r + dPort / Math.hypot(sl, 1), th, near ? 0.9 + 1.3 * fr() : 1.7 + 3.2 * fr(), D.position);      // up the wall to port and close under the surface: inside the frame, not under its lower edge
      _X.set(Math.sin(th), 0, -Math.cos(th)).applyAxisAngle(UP, turn); _X.y = fr.range(-0.08, 0.12); _X.normalize();   // heads up-current, each sub-school slanted across it
      _Y.copy(UP).addScaledVector(_X, -_X.y).normalize(); _Z.crossVectors(_X, _Y);
      D.quaternion.setFromRotationMatrix(_m.makeBasis(_X, _Y, _Z)); D.scale.setScalar((near ? fr.range(2.0, 2.7) : fr.range(1.4, 2.1)) * (near && weatherId === 'fog' ? 1.3 : 1)); D.updateMatrix(); shoal.setMatrixAt(k, D.matrix);      // (under the fog sky the near ones are a third longer and darker: they were pale leaves under the lace)
    }
    shoal.instanceMatrix.needsUpdate = true; scene.add(shoal);
    await ctx.yield();
    const nKelp = Math.round(46 * Math.min(1.2, dens)), kelp = new THREE.InstancedMesh(kelpGeo(), matKelp, nKelp);
    for (let k = 0; k < nKelp; k++) {
      polarAt(mix(uG0 - 0.02, Math.max(uG1, fish1), fr()), pol);
      const sl = slopeAt(pol.r), th = pol.th;
      underPoint(pol.r + (-8 + 22 * fr()) / Math.hypot(sl, 1), th, 2.2 + 5 * fr(), D.position);
      _X.set(-Math.sin(th), -0.12 - 0.2 * fr(), Math.cos(th)).normalize(); _Y.copy(_n).addScaledVector(_X, -_n.dot(_X)).normalize(); _Z.crossVectors(_X, _Y);
      D.quaternion.setFromRotationMatrix(_m.makeBasis(_X, _Y, _Z)); D.scale.setScalar(fr.range(0.8, 1.25)); D.updateMatrix(); kelp.setMatrixAt(k, D.matrix);
    }
    kelp.instanceMatrix.needsUpdate = true; scene.add(kelp);
    await ctx.yield();
    D.scale.copy(ONE);
    const swimmers = [];
    for (let i = 0; i < (swimmerKind ? 2 : 1); i++) { const m = new THREE.Mesh(i ? swimmers[0].geometry : swimmerGeo(swimmerKind), matSwim); m.scale.setScalar(swimmerKind ? 2.0 : 3.0); m.visible = false; swimmers.push(m); scene.add(m); }
    await ctx.yield();
    // The seal (kind 0) is posed for the eye: it comes up 8 m off the port bow and hangs there in profile, head up and
    // turned to us, dark back above, leaning its pale chest toward us (u = uSeal +- 0.05, about four seconds); as it
    // sinks astern it rolls on over onto its back. It is placed from the path (never from the camera object), so it is
    // the same through a portal. Porpoises (kind 1) cut across the bow.
    const _ey = V3(), _Lv = V3(), _Us = V3(), _Rs = V3(), _cw = V3();
    // behind the seal, a soft patch of lit water (the wall's dark rifling must never be what it hangs against); it is
    // drawn before the surface and behind the seal, which therefore stays a silhouette
    let sealLight = null;      // made with the other fx (5i), once their group exists
    // calmK: 0 under the sweeping camera, 1 under the steady one (read each frame off the camera's roll: the steady
    // camera never banks, the sweeping one banks 40 degrees on the wall). The steady camera looks 136 m down the route
    // and pois pull it a third as much, so for it the seal hangs 7.5 m further ahead and close under the track, where
    // that gaze holds it inside the middle of the frame; the sweeping camera keeps the close pass off the port bow.
    let calmK = 0;
    const sealLead = (ph, i) => (swimmerKind ? (ph < -1 ? 12 - 8 * (ph + 1) : ph < 1 ? 8.5 - 2.5 * ph : 6 - 16 * (ph - 1)) - i * 2.5 : (ph < -1 ? 10 - 8 * (ph + 1) : ph < 1 ? 8 - 2 * ph : 6 - 14 * (ph - 1)) + 7.5 * calmK);
    function sealPoint(u, i, time, out, gaze) {      // (gaze: the point the camera's poi aims at, which is where the seal swam before it was moved out from under the bow, so the camera turns exactly as it did)
      const out2 = rare && !swimmerKind && !gaze, ph = (u - uSeal) / 0.05 - i * 0.25, s = u * LEN + sealLead(ph, i) + (out2 ? 1.5 : 0);      // (on the rare cough it comes late, u 0.672, when the ride's bow is banked over it: 3 m further to port and 1.5 m further ahead)
      path.posAtDist(s, _lp);
      const r0 = Math.hypot(_lp.x, _lp.z), th = Math.atan2(_lp.z, _lp.x), sl = slopeAt(r0);
      // (the porpoises roll at the surface: back and fin out of the water every 3.7 s, never deeper than 0.7 m while they are with us)
      underPoint(r0 + (swimmerKind ? 2.2 + i * 1.8 : mix(out2 ? 6.0 : 3.0, 1.0, calmK)) / Math.hypot(sl, 1), th, (swimmerKind ? 0.95 - 0.62 * Math.max(0, Math.sin(time * 1.7 + i * 2.1)) : mix(1.9, 1.7, calmK) + 0.25 * Math.sin(time * 0.8 + i * 2)) + 2.5 * sstep(1.2, 3.0, ph), out);   // leaves _n = the wall normal
      return th;
    }
    function placeSwimmers(u, time, camPos) {
      for (let i = 0; i < swimmers.length; i++) {
        const m = swimmers[i], ph = (u - uSeal) / 0.05 - i * 0.25;
        if (Math.abs(ph) > 3.2) { m.visible = false; if (i === 0) { sealU.value.y = -9999; if (sealLight) { hero.setClear(null); sealLight.uniforms.uIntensity.value = 0; } } continue; }
        m.visible = true;
        const th = sealPoint(u, i, time, m.position);
        if (swimmerKind) {
          _X.set(-Math.sin(th), 0, Math.cos(th)).applyAxisAngle(_n, -0.35); _Z.crossVectors(_X, _n);
          m.quaternion.setFromRotationMatrix(_m.makeBasis(_X, _n, _Z));
          m.quaternion.multiply(_q.setFromEuler(_e.set(0.3 * Math.sin(time * 0.9 + i), 0, 0.38 * Math.cos(time * 1.7 + i * 2.1))));      // nose up as it rises, down as it goes under
        } else {
          // frame of the sight line: Lv toward the eye, Us up the picture, Rs to its right
          path.posAtDist(u * LEN, _ey); _Lv.subVectors(_ey, m.position).normalize();
          _Us.copy(_n).addScaledVector(_Lv, -_n.dot(_Lv)).normalize(); _Rs.crossVectors(_Us, _Lv);
          const up = 0.22 + 0.42 * bell(ph, -1.6, 1.5, 0.6), toUs = 0.12 + 0.3 * bell(ph, -1.2, 1.3, 0.5);
          _X.copy(_Rs).multiplyScalar(Math.cos(up)).addScaledVector(_Us, Math.sin(up)).addScaledVector(_Lv, toUs).normalize();
          _Y.copy(_Us).addScaledVector(_X, -_Us.dot(_X)).normalize(); _Z.crossVectors(_X, _Y);
          m.quaternion.setFromRotationMatrix(_m.makeBasis(_X, _Y, _Z));
          // side-on as it comes up; it leans its chest toward us and hangs there in profile (dark back in the
          // silhouette, pale throat and chest, the far flipper spread below), watching us; then it turns on its back
          const roll = -0.34 * sstep(-2.0, -0.9, ph) - 2.5 * sstep(1.05, 2.5, ph) + 0.08 * Math.sin(time * 0.9);
          m.quaternion.multiply(_q.setFromEuler(_e.set(roll, 0, 0.06 * Math.sin(time * 1.1))));
          // the foam parts where our sight line to it crosses the surface, and the water behind it is lit
          const on = 1 - sstep(2.2, 3.1, Math.abs(ph));
          _cw.subVectors(camPos, m.position).normalize(); const climb = Math.max(_cw.dot(_n), 0.35);
          sealLight.object.position.copy(m.position).addScaledVector(_cw, -2.4);
          sealLight.uniforms.uIntensity.value = 0.5 * on * HR.glow * WX.glowK;
          hero.setClear(_cw.multiplyScalar(1.5 / climb).add(m.position), 6.5 * on);
        }
        if (i === 0) sealU.value.set(m.position.x, m.position.y, m.position.z, 1);
      }
    }
    // the herring ball, deeper in (kit baitball; it is drawn before the water surface and tinted by it)
    polarAt(mix(fish0, fish1, 0.64), pol);
    const ballAt = underPoint(pol.r + (fishKind === 2 ? 10 : 15) / Math.hypot(slopeAt(pol.r), 1), pol.th, fishKind === 2 ? 6 : 9, V3());
    // (a strong fill from the sky and off the water: a gull gliding edge-on in the rim's shadow must still be a pale bird, not a black dash)
    const faunaLight = { sunDir: sunDir.toArray(), sunColor: HR.sun, sunIntensity: (night ? 1.1 : 2.6) * WX.sunK, sky: night ? zenithHex : '#AEBCC4', skyIntensity: night ? 1.6 : 2.0, ground: night ? '#2A5A50' : '#4C7668', groundIntensity: night ? 0.8 : 1.4 };
    if (WX.rain && !night) { faunaLight.sunIntensity = 1.9; faunaLight.sunColor = lerpHex(HR.sun, '#D2DAE0', 0.85); faunaLight.sky = '#A3B2C0'; faunaLight.skyIntensity = 1.6; }   // under the squall the birds are grey-white against slate, not gold
    const fauna = F.makeFauna(scene, { light: faunaLight });
    await ctx.yield();
    fauna.add(F.makeFishSchool({ rng: rng.fork('herring'), species: 'sardines', count: fishKind === 2 ? 900 : 600, size: 2.6, center: ballAt.toArray(), spread: [fishKind === 2 ? 5.5 : 4.5, 4],
      light: { sunDir: sunDir.toArray(), sunColor: '#C8D890', sunIntensity: 1.4, sky: '#8FA23C', skyIntensity: 1.2, ground: '#1E5A4C', groundIntensity: 1.0 } }));
    await ctx.yield();

    // ---------- 5h. birds: three flocks wheeling the same way as the water, eagles above, one across the bow ----------
    const BD = BIRDS[birdId], nG = Math.max(20, Math.round(54 * dens * detail));
    // by place: every gull call hands maxSigma 3 (no dealt place beyond three scatters), the gulls' own wander GW (a roam of about a wing's length) and keepClear CLR: the kit
    // shifts the dealt flock's baked course until no body is within 2.3 m of the flown line (no push downward; the line sampled every 4 m along from..to, the only stretch of the route that flock can come near on any seed; its sag added by the kit).
    // routeSamples 64: the loop's baked course in fewer samples, which the kit's clearing walks (its cost at the build goes with them)
    const GW = [1.2, 0.6, 1, 0.35], CLR = { path, dist: 2.3, up: true, step: 4 };
    const flock = async (radius, y, count, name, spread, near) => fauna.add(await F.makeFlockAsync({ rng: rng.fork(name), species: 'gulls', count, size: BD.size, palette: BD.palette, maxSigma: 3, wander: GW, keepClear: { ...CLR, ...near }, routeSamples: 64,
      center: [0, y, 0], radius, height: radius * 0.1, wobble: 0.16, direction: 1, spread, speed: 13, dihedral: 0.34, glide: 0.3 }, ctx.yield));      // wings held in a shallow V and beating more than gliding: edge-on at eye level a gull is a bird's M, not a black dash
    await ctx.yield();                                         // each flock that hands keepClear is made by the kit's stepped maker (the same flock to the bit; its clearing is handed back to the page in slices)
    await flock(62, -34, nG, 'g1', [24, 16, 340], { from: 0.6, to: 0.87 });
    await ctx.yield();
    await flock(150, 14, nG, 'g2', [40, 16, 820], { from: 0.13, to: 0.66 });
    await ctx.yield();
    await flock(236, 32, Math.round(nG * 0.9), 'g3', [44, 14, 1250], { from: 0, to: 0.56 });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('eagles'), species: 'eagles', center: [0, 96, 0], radius: 140 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('eagle'), species: 'eagles', count: 1, form: 'loose', size: 1.35, spread: [0.1, 0.1, 0.1], maxSigma: 3, wander: [0, 0, 0, 0.2], speed: 15, glide: 0.92,
      cross: { path, u: 0.34, lead: 15, angle: 78, side: 1, height: 1.2, span: 110, rise: -26, duration: DUR } }));      // lead 15: the crossing lies far enough ahead that the eagle's body, taken also as the kit's own widest ball, stays over 2.0 m from the lens at every u (no keepClear and no wander: its course is laid from the path alone and its travel is keyed to u; the course itself passes about 1.2 m from the line, where the lens never is when the eagle is)
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('lift'), species: 'gulls', count: 9, size: BD.size, palette: BD.palette, spread: [10, 3, 14], maxSigma: 3, wander: GW, keepClear: { ...CLR, from: 0.04, to: 0.11, ease: 40 },
      cross: { path, u: 0.045, lead: 24, angle: 58, side: -1, height: 1.2, span: 120, rise: 20, duration: DUR } }, ctx.yield));      // ease 40: the kit lifts the crossing over the flown line and eases the lift out along the course (over half of the course rises by a metre or more, up to about 12 m at the hump; its ends move by centimetres)
    await ctx.yield();

    // ---------- 5i. kelp rafts on the race, spray, puffs, the rare mast, mistbow ----------
    const nRaft = Math.max(12, Math.round(34 * dens * detail)), matRaft = propMaterial(U, { spec: 0.25, wet: 0, amb: 1.3, rim: 0.5 }), rafts = new THREE.InstancedMesh(raftGeo(), matRaft, nRaft), raftD = [];
    await ctx.yield();
    for (let k = 0; k < nRaft; k++) { const r = rng.range(317, 400); raftD.push({ r, th0: Math.PI - 0.15 + rng.range(-0.55, 0.22), om: hero.angularSpeed(r), sc: rng.range(1.2, 3.0), yaw: rng.range(0, TAU) }); }
    rafts.frustumCulled = false; scene.add(rafts);
    await ctx.yield();
    function placeRafts(time, camPos) {
      for (let k = 0; k < nRaft; k++) {
        const o = raftD[k]; seat(o.r, o.th0 + o.om * time, o.yaw + time * 0.05, 0.03, 0, 0);
        const dx = D.position.x - camPos.x, dz = D.position.z - camPos.z, d = Math.hypot(dx, dz);
        if (d < 6 + o.sc && d > 1e-3) { const push = 6 + o.sc - d; D.position.x += (dx / d) * push; D.position.z += (dz / d) * push; }
        // none lies on the run-in line (first 60 m): the leader stands there in the opening frame, clear water under it
        const ax = D.position.x - pts[0].x, az = D.position.z - pts[0].z, al = ax * HD.x + az * HD.z, lat = ax * LEFT.x + az * LEFT.z, need = (8 + o.sc - Math.abs(lat)) * sstep(-14, -2, al) * (1 - sstep(62, 80, al));
        if (need > 0) { const sg = lat < 0 ? -1 : 1; D.position.x += LEFT.x * sg * need; D.position.z += LEFT.z * sg * need; }
        D.scale.set(o.sc, 0.6 + 0.2 * o.sc, o.sc); D.updateMatrix(); rafts.setMatrixAt(k, D.matrix);
      }
      rafts.instanceMatrix.needsUpdate = true; D.scale.copy(ONE);
    }
    const fxTime = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    if (!swimmerKind) { sealLight = fx.makeGlow({ position: [0, -9999, 0], color: HR.glowColor || '#A9C34C', size: 13, intensity: 0, halo: 1, core: 0, near: [0.03, 0.2], depthBias: 0, fogAmount: 0, time: fxTime, renderOrder: 8 }); set.add(sealLight); }
    set.add(fx.makeParticles({ rng: rng.fork('spray'), preset: 'snow', count: Math.round(1500 * detail), box: [36, 16, 36], velocity: [2.5, -1.2, -3.5], velocityRandom: [2, 1.2, 2], turbulence: [1.2, 0.5, 0.8],
      size: [0.03, 0.09], colors: [pal[5], pal[5], '#ffffff'], opacity: night ? 0.35 : 0.6, time: fxTime }));
    await ctx.yield();
    if (WX.rain) set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', count: Math.round(2600 * detail), opacity: 0.32, time: fxTime }));
    if (HR.mistbow) set.add(fx.makeRainbow({ sunDir: sunDir.toArray(), intensity: 0.2, secondary: false }));
    await ctx.yield();
    // puffs: 0-9 our bow, 10-21 the water breaking out of the wreck's side, 22-25 the leader's bow, 26-55 the rare
    // cough's jet, 56-63 the water the mast trails, 64-71 streamers falling off the jet
    const PD = 72, NDROP = 40, NP = PD + NDROP, PW = 10, PL = 22, PC = 26, NCOL = 30, PM = 56, PS = 64, pA = new Float32Array(NP * 4), pB = new Float32Array(NP * 4);      // 72-111: droplets off the mast's fan of water
    const pg = new THREE.InstancedBufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
    const pAa = new THREE.InstancedBufferAttribute(pA, 4), pBa = new THREE.InstancedBufferAttribute(pB, 4); pAa.setUsage(THREE.DynamicDrawUsage); pBa.setUsage(THREE.DynamicDrawUsage);
    pg.setAttribute('aP', pAa); pg.setAttribute('aQ', pBa); pg.instanceCount = NP;
    for (let i = 0; i < NP; i++) pB[i * 4 + 1] = hash(i * 3.7);
    const puffs = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: PUFF_VS, fragmentShader: PUFF_FS, fog: true, ...PREMUL }));
    puffs.frustumCulled = false; puffs.renderOrder = 15; scene.add(puffs);
    await ctx.yield();
    const puff = (i, p, size, alpha, bright = 0, erode = 0) => { pA[i * 4] = p.x; pA[i * 4 + 1] = p.y; pA[i * 4 + 2] = p.z; pA[i * 4 + 3] = size; pB[i * 4] = alpha; pB[i * 4 + 2] = bright; pB[i * 4 + 3] = erode; };
    // the rare event: an 18 m pine mast shot out of the throat at u 0.50, tumbling, clearing the mist collar into the
    // sun (apex y -18), falling back by u 0.60
    let mast = null; const mastAxis = V3(1, 0, 0), _mq = new THREE.Quaternion(), _ma = V3(), _mb2 = V3();
    // (it is thrown 26 m toward where we are at u 0.55: at its apex it is a tenth of the frame long, in the gaze)
    const mastLean = V3(); { polarAt(0.55, pol); mastLean.set(Math.cos(pol.th) * 26, 0, Math.sin(pol.th) * 26); }
    const mastAt = (uu, out) => { const f = (uu - 0.5) / 0.1, k = Math.sin(Math.PI * sat(f)); return out.set(-3 + 6 * f + mastLean.x * k, -128 + 4 * 110 * f * (1 - f), -4 + 8 * f + mastLean.z * k); };
    if (rare) {
      // dark wet pine with a thin gold edge toward the sun (tinted 0.95 it was a pale stick)
      mast = new THREE.Mesh(mastGeo(), propMaterial(U, { wig: [0.3, 5, 0.8, 1], spec: 1.0, wet: 0, rim: 3.0, rimWide: 1, sheen: 0.8, tint: new THREE.Color(0.46, 0.34, 0.24) })); mast.visible = false; mast.scale.set(1.5, 4.5, 4.5); scene.add(mast);
      polarAt(0.55, pol); mastAxis.set(Math.cos(pol.th), 0, Math.sin(pol.th));
    }
    await ctx.yield();
    const _f = V3(), _rt = V3(), _up = V3(), _w = V3(), _c2 = V3();
    function placePuffs(u, time, camera, camPos) {
      camera.getWorldDirection(_f); _rt.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); _up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      const A0 = 0.6 * bell(u, 0.055, 0.125, 0.35);
      if (u > 0.5) {      // (the bow bursts are long over) spray torn off the brow where the water pours over it, either side of the sight line to the ring, thrown out over the throat and falling into it
        const B0 = (0.35 * sstep(0.8, 0.85, u) + 0.65 * sstep(0.885, 0.905, u)) * (1 - sstep(0.918, 0.94, u)),      // (thickest as the wreckage goes over)
          cth = Math.atan2(camPos.z, camPos.x);
        for (let k = 0; k < 10; k++) { const p = (time * (0.5 + 0.2 * hash(k * 1.7)) + k / 10 + hash(k) * 0.3) % 1, th = cth + 0.1 + 0.34 * hash(k * 7.1) + 0.02 * p, rr = 55.5 - 4 * p;      // (all of it over the stretch of the brow where the wreckage goes over, left of the ring: single puffs to the right of it were white balls against the dark of the shaft)
          _w.set(Math.cos(th) * rr, -110.5 + 3.5 * p * (1.2 - p) * (0.6 + 0.8 * hash(k * 3.3)) - 8 * p * p, Math.sin(th) * rr);
          puff(k, _w, 0.6 + 1.3 * p, Math.sin(Math.PI * Math.pow(p, 0.6)) * 0.55 * B0, 0.3, 0.8); }      // (small torn rags: at 1.5 - 4 m they were soft white balls against the dark of the shaft)
      } else
      for (let k = 0; k < 10; k++) { const p = (time * 0.85 + k / 10 + hash(k) * 0.3) % 1, sd = (k % 2 ? 1 : -1) * (0.7 + 1.5 * hash(k * 2.3));
        _w.copy(camPos).addScaledVector(_f, 3.6 + 2.6 * hash(k * 5.1) + 1.5 * p).addScaledVector(_rt, sd * (1 + 0.7 * p)).addScaledVector(_up, -2.3 + 2.4 * p * (1.3 - p));
        puff(k, _w, 0.3 + 0.7 * p, Math.sin(Math.PI * p) * A0 * (u > 0.9 ? 0 : 1)); }
      // the wreck: small torn puffs thrown out of the breach and falling to the water, a few rolling along the waterline
      for (let k = 0; k < PL - PW; k++) { const p = (time * (0.75 + 0.3 * hash(k * 1.3)) + k / 12 + hash(k * 4.1)) % 1, low = k % 4 === 3;
        if (wreckKind === 0) _w.set(-2.3 + 4.6 * hash(k * 2.9) + 0.3 * p, low ? 0.35 + 0.2 * p : 0.75 + 0.9 * p - 1.9 * p * p, low ? 2.5 + 1.2 * p : 1.75 + (1.3 + 0.9 * hash(k * 6.3)) * p);
        else _w.set(-2.5 + (k % 6) * 1.1, 0.25 + 1.1 * p * (1 - p) * 2, 2.3 + 1.6 * p);
        _w.applyQuaternion(wreck.quaternion).add(wreck.position);
        puff(PW + k, _w, wreckKind === 0 ? (low ? 0.7 + 0.9 * p : 0.42 + 0.7 * p) : 0.5 + 0.9 * p, Math.sin(Math.PI * Math.pow(p, 0.7)) * (wreckKind === 0 ? 0.7 : k < 6 ? 0.3 : 0), 0.15, wreckKind === 0 ? 0.45 : 0.4); }
      for (let k = 0; k < 4; k++) { const p = (time * 0.9 + k / 4) % 1;
        _w.set(5.4 - 1.5 * p, 0.3 + 1.5 * p * (1 - p) * 2, (k % 2 ? 1 : -1) * (0.7 + 1.3 * p)).applyQuaternion(leader.quaternion).add(leader.position); puff(PL + k, _w, 0.6 + 1.1 * p, Math.sin(Math.PI * p) * 0.5); }
      if (mast) {
        const f = (u - 0.5) / 0.1, on = f > 0 && f < 1;
        mast.visible = on;
        if (on) { mastAt(u, mast.position); _mq.setFromAxisAngle(mastAxis, 0.5 + f * TAU * 1.3); mast.quaternion.setFromUnitVectors(_ma.set(1, 0, 0), UP).premultiply(_mq); }
        // the jet it rides on: thirty torn puffs, broad and dim at the foot in the pit's shadow, narrow and bright at the
        // head; each one climbs and is replaced, so the column boils upward
        const g = sat(f), env = sstep(-0.03, 0.05, f) * (1 - sstep(0.9, 1.3, f)), topY = Math.max(-104, Math.min(-70, -128 + 4 * 110 * g * (1 - g) - 12));      // (the jet stops 30 m over the lip: carried all the way up to the mast it was a rope of grey smoke)
        for (let k = 0; k < NCOL; k++) { const fk = ((k + 0.5) / NCOL + time * 0.22) % 1, a = k * 2.4 + time * 0.3, rr = (0.6 + 4.6 * (1 - fk)) * (0.6 + 0.8 * hash(k * 1.9));
          const lk = 0.3 * Math.sin(Math.PI * g) * fk * fk;      // the column leans a little after the mast it threw
          _w.set(Math.cos(a) * rr - 3 + 6 * g * fk + mastLean.x * lk, mix(-127, topY, Math.pow(fk, 0.85)) + 1.2 * Math.sin(time * 1.4 + k * 1.9), Math.sin(a) * rr - 4 + 8 * g * fk + mastLean.z * lk);
          puff(PC + k, _w, mix(8.5, 3.0, fk) * (0.8 + 0.4 * hash(k * 5.3)), 0.7 * env * Math.sin(Math.PI * Math.pow(fk, 0.6)) * mix(1, sstep(-98, -88, _w.y), sstep(0.2, 0.36, f)), mix(-0.1, 0.9, fk), 0.75); }      // (once the mast is up, nothing of the jet is left below y -90: its foot lay in the pit as a soft grey puff)
        // water streaming off the mast as it turns (strung along it, lagging), and streamers falling back off the jet
        for (let j = 0; j < PS - PM; j++) { const uj = u - 0.0025 * (1 + (j >> 1)), fj = (uj - 0.5) / 0.1; mastAt(uj, _w);
          _mb2.set(j % 2 ? 7 : -7, 0, 0).applyQuaternion(mast.quaternion).multiplyScalar(1.5 * (1 + 0.25 * (j >> 1))); _w.add(_mb2); _w.y -= 2 + 3.4 * (j >> 1);
          puff(PM + j, _w, 3.2 + 1.5 * (j >> 1), fj > 0 && fj < 1 ? 0.75 * (1 - (j >> 1) / 5) : 0, 1.7, 0.95); }      // a white fan of water in the sun, not a rope of grey smoke
        for (let j = 0; j < PD - PS; j++) { const p = (time * 0.33 + j / 8 + hash(j * 7.1)) % 1, a = j * 0.9 + 1.3, rr = 3 + 15 * p;
          _w.set(Math.cos(a) * rr - 3 + 6 * g, topY + 4 + 10 * p - 46 * p * p, Math.sin(a) * rr - 4 + 8 * g); puff(PS + j, _w, 2.6 - 1.2 * p, 0.65 * env * Math.sin(Math.PI * Math.pow(p, 0.5)) * mix(1, sstep(-98, -88, _w.y), sstep(0.2, 0.36, f)), 0.2, 0.9); }
        // ... breaking into droplets: forty small bright ones strung out behind and below the mast, each falling on its own arc
        for (let j = 0; j < NDROP; j++) { const lag = 0.002 + 0.03 * hash(j * 3.3), uj = u - lag, fj = (uj - 0.5) / 0.1, tt = lag * DUR; mastAt(uj, _w);
          _mb2.set((hash(j * 5.7) * 2 - 1) * 15, 0, 0).applyQuaternion(mast.quaternion); _w.add(_mb2);
          _w.x += (hash(j * 2.1) - 0.5) * 9 * tt; _w.z += (hash(j * 8.9) - 0.5) * 9 * tt; _w.y -= 1 + 4.9 * tt * tt * 0.5 + 2 * hash(j * 6.1) * tt;
          puff(PD + j, _w, 0.55 + 0.8 * hash(j * 4.3), fj > 0 && fj < 1 ? 0.95 : 0, 1.8, 0.3); }      // (it flies 150 m off: under half a metre they were less than a pixel)
      }
      pAa.needsUpdate = true; pBa.needsUpdate = true;
    }

    // ---------- 5j. POIS ----------
    const gz = V3(), wz = V3(), mz = V3(), sz = V3(), pe = V3(), pt2 = V3(), yz = V3(), lz = V3(), fw = V3(), bz = V3(), polF = { r: 0, th: 0 };
    const farLip = (t, u) => { polarAt(u, polF); const a = polF.th + Math.PI; return fw.set(Math.cos(a) * 60, -92, Math.sin(a) * 60); };
    const pois = [
      // THE IMAGE (u 0.13 - 0.33): the gaze goes to the far lip of the pit, straight across the axis from wherever we are, so
      // the dark crescent under the mist plume sits in the middle half of the frame with the lit far wall climbing above it
      // (two pulls on the same point: 0.8 in all from u 0.19 to 0.27; the steady camera takes a third of each)
      { at: farLip, from: 0.08, to: 0.36, weight: 0.6 },
      { at: farLip, from: 0.13, to: 0.32, weight: 0.6, fade: 0.3 },
      // the wreck: the gaze goes to it while it is ahead, and never swings further than 45 degrees off the bow as it falls abeam
      { at: (t, u) => { const o = wreckOrb, du = (u - o.u) * DUR; hero.surfaceAt(orbR(o, du), o.th0 + o.om * du, undefined, wz); wz.y += 1.9;
          path.posAtDist(u * LEN, pe); path.tangentAtDist(u * LEN, pt2); wz.sub(pe).addScaledVector(pt2, -4); const al = wz.dot(pt2), lat = Math.sqrt(Math.max(wz.lengthSq() - al * al, 0)); if (al < lat) wz.addScaledVector(pt2, lat - al); return wz.add(pe); }, from: 0.35, to: 0.475, weight: 0.78 },
      // the glass: down and to port, into the lit water where the shoal hangs
      { at: (t, u) => { path.posAtDist(u * LEN + 11.5, gz); const r = Math.hypot(gz.x, gz.z), th = Math.atan2(gz.z, gz.x); return underPoint(r + 3.2 / Math.hypot(slopeAt(r), 1), th, 4.3, gz); }, from: rare ? 0.6 : fish0 - 0.01, to: rare ? 0.74 : fish1 + 0.03, weight: 0.56 },
      // ... and to the seal itself while it hangs off the bow
      { at: (t, u) => { sealPoint(u, 0, 0, sz, true); return sz; }, from: uSeal - 0.085, to: uSeal + 0.07, weight: swimmerKind ? 0.3 : 0.5, fade: 0.3 },
      { at: portalPos.clone(), from: rare ? 0.72 : 0.66, to: 0.98, weight: 0.66 },                                    // the ring burning in the shaft
      // ... held nearer the middle of the frame on the lower wall (with the entry above: 0.88 in all), so the steady
      // camera, which takes a third of every weight, keeps the ring off the bottom edge
      { at: portalPos.clone(), from: 0.735, to: 0.935, weight: 0.64, fade: 0.25 },
      // the yard and the barrels off the starboard bow (never further than 45 degrees off the bow, like the wreck)
      { at: (t, u) => { const o = yardOrb, du = (u - o.u) * DUR; hero.surfaceAt(orbR(o, du), o.th0 + o.om * du - 2.2 / o.r, undefined, yz); yz.y += 0.4;
          path.posAtDist(u * LEN, pe); path.tangentAtDist(u * LEN, pt2); yz.sub(pe); const al = yz.dot(pt2), lat = Math.sqrt(Math.max(yz.lengthSq() - al * al, 0)); if (al < lat) yz.addScaledVector(pt2, lat - al); return yz.add(pe); }, from: 0.468, to: rare ? 0.5 : 0.55, weight: 0.3, fade: 0.3 },
      // the second boat on the slope to port while it is close (u 0.5 - 0.66): held inside the frame with the shoal under it
      // (the gaze follows the course the boat held before it was made to lose way from u 0.6, so the camera turns exactly as it did)
      { at: (t, u) => { if (u > 0.6) { polarAt(u + (21 - 45 * (u - 0.52) - 690 * Math.max(0, u - 0.65)) / LEN, polF); polF.r += 9.5 / Math.hypot(slopeAt(polF.r), 1); } else b2Polar(u, polF);
          hero.surfaceAt(polF.r, polF.th, undefined, bz); bz.y += 2.4; return bz; }, from: rare ? 0.6 : 0.49, to: 0.665, weight: rare ? 0 : 0.34, fade: 0.3 },      // (not on the rare cough: the gaze is coming back from the mast then, and a second pull made that turn faster)
      // the leader as we come up on it (u 0.66 - 0.75): held whole in the frame, its heeled hull and sail against the wall,
      // until we are abeam; then the gaze goes down to the ring (it used to sit cut in half by the left edge)
      { at: (t, u) => lz.copy(leader.position).addScaledVector(UP, 3.2), from: 0.64, to: 0.752, weight: 0.5, fade: 0.32 },
    ];
    if (rare) pois.push({ at: (t, u) => mastAt(Math.min(0.56, Math.max(0.51, u)), mz), from: 0.465, to: 0.625, weight: 0.72, fade: 0.28 });

    // the ring's light: one warm glow wrapped round it in the shaft, drawn AFTER the mist (renderOrder 15, depth-tested:
    // the near lip still hides it) and not dimmed by fog, so it shows through the collar; a faint one 6 m up the dive
    // line; and, in the hero's own shaders (hero.setSeat), the ring's light scattered by the mist on the sight line and
    // lying on the shaft wall. All of it is stronger under pale mist (squall, fog, day), where a faint glow is lost.
    U.uBrkK.value = WX.rain ? 0.5 : 1;      // the froth threads on the breaker's back: half as strong under the squall
    const emberK = night ? 1 : hourId === 'day' ? 1.7 : (WX.rain || weatherId === 'fog') ? 1.35 : hourId === 'dawn' ? 1.2 : 1;      // (at 2 - 2.5 the whole throat went khaki and flat: the ring is the one bright thing in a dark shaft)
    const glowDeep = fx.makeGlow({ position: portalPos.clone().addScaledVector(diveDir, 3).toArray(), color: '#FFC474', size: 44, intensity: 2.0, halo: 1, core: 0.25, fogAmount: 0, time: fxTime, renderOrder: 15 });
    const glowHigh = fx.makeGlow({ position: portalPos.clone().addScaledVector(diveDir, -6).toArray(), color: '#FFE0AE', size: 34, intensity: 0.2, halo: 1, core: 0.0, fogAmount: 0.3, time: fxTime, renderOrder: 12 });
    set.add(glowDeep); set.add(glowHigh);
    hero.setSeat(portalPos, 0);
    await ctx.yield();

    // squall: the one slot of sun is steered to where we are looking, keyed to u
    const SLOT = [[0, -330, 40], [0.2, 165, 95], [0.45, 87, -131], [0.65, 99, 71], [0.9, 0, 150], [1, 0, 150]];
    const slotPhase = (u) => { let i = 0; while (i < SLOT.length - 2 && u > SLOT[i + 1][0]) i++; const a = SLOT[i], b = SLOT[i + 1], f = sstep(a[0], b[0], u), x = mix(a[1], b[1], f), z = mix(a[2], b[2], f), K = U.uShade.value;
      return -Math.PI / 2 - (x * K.x + z * K.y) - 0.9 * Math.sin(x * K.y * -0.7 + z * K.x * 0.7 + 1.7); };

    // ---------- 5k. update ----------
    const camPol = V3(), wakePos = V3(), aft = V3(), cbP = V3(), keepP = V3();
    function update(dt, time, camera, u = 0) {
      camera.getWorldPosition(camPol);          // never camera.position: behind a portal the camera's matrix is set directly
      calmK = 1 - sstep(0.06, 0.4, Math.abs(camera.matrixWorld.elements[1]));      // the camera's right vector, y: 0 when it does not bank
      hero.update(dt, time, camera);
      fxTime.value = time;
      sky.update(dt, time, camera); rig.update(dt, time, camera); if (ridges) ridges.update(dt, time, camera); if (towers) towers.update(dt, time, camera);
      shelfU.uShelf.value.z = -time * 0.007;                 // the shelf turns with the water under it, one degree every 2.5 s
      if (bars) bars.position.z = -4 * time;                 // the bars drift north
      U.uShade.value.z = WX.rain ? slotPhase(u) + 0.12 * Math.sin(time * 0.21) : time * 0.035;
      // mist: thinned for the portal's sight line across the lip; on the rare cough it collapses, then re-forms
      let m = 1 - 0.5 * sstep(0.62, 0.7, u) - 0.14 * sstep(0.74, 0.82, u) * (1 - sstep(0.89, 0.93, u));      // (thinner still while we look down the throat: a dark shaft behind the ring, not a grey bank)
      // (and a step thinner, darker and greener from u 0.8 to 0.9, most under the pale fog sky: a black-green shaft behind the ring, never a khaki bowl)
      const pitK = sstep(0.78, 0.84, u) * (1 - sstep(0.9, 0.94, u));
      m -= (weatherId === 'fog' ? 0.2 : 0.08) * pitK; hero.setPit((weatherId === 'fog' ? 1 : WX.rain ? 0.7 : 0.45) * pitK);
      hero.setPour(sstep(0.8, 0.85, u) * (1 - sstep(0.9, 0.935, u)));      // white water pouring over the brow below us
      if (rare) m *= 1 - 0.9 * (sstep(0.488, 0.505, u) - sstep(0.57, 0.65, u));
      // on the way in (u 0.12 - 0.38) the collar round the lip is thinned to 40%: the pit under the plume is dark water, not a pale lid
      hero.setMist(m, 1 - 0.6 * (sstep(0.12, 0.2, u) - sstep(0.3, 0.38, u)));
      // the shoal: as we run along the glass a window of clear glass 40 m across opens ahead and to port, where the cod hang
      const fk = bell(u, fish0 - 0.05, fish1 + 0.015, 0.035);      // (from u 0.47: the sunk foam layers beside the bow go with it)
      if (fk > 0.02) { path.posAtDist(u * LEN + 11, cbP); const r = Math.hypot(cbP.x, cbP.z); hero.surfaceAt(r + 4.5 / Math.hypot(slopeAt(r), 1), Math.atan2(cbP.z, cbP.x), undefined, cbP); hero.setClearB(cbP, 20 * fk); } else hero.setClearB(null);
      // fog weather: thick on the race (only the leader and the breaker stand out of it), thinning as we tip in, so
      // the far wall arrives as a ghost at u 0.2 and is clear by 0.3. Then one veil as we go over the lip.
      const fogK = WX.fogNear ? mix(WX.fogNear / WX.fog, 1, sstep(0.07, 0.2, u)) : 1;
      scene.fog.density = baseFog * fogK * (1 + 8 * bell(u, 0.918, 0.958, 0.4));
      placeLeader(u, time); placeBoat2(u, time); placeBoat3(u, time, camPol); placeRowers(u, time); placeOrbiters(u, time, camPol); placeLipWreck(u, time); placeSwimmers(u, time, camPol); placeRafts(time, camPol);
      // clear air round the sight line to the leader as we come over the crest: the spindrift flies beside it, never over it
      const kp = 1 - sstep(0.12, 0.17, u);
      if (kp > 0.02) hero.setKeep(keepP.copy(leader.position).addScaledVector(UP, 3), 6 * kp); else hero.setKeep(null);
      placePuffs(u, time, camera, camPol);
      // the ring's glow breathes with the collar; it is there from the moment the gaze turns to the throat
      const gl = sstep(0.6, 0.68, u) * (1 - 0.6 * sstep(0.95, 0.99, u)) * (0.82 + 0.18 * Math.sin(time * 0.9));
      const far = 1 - sstep(weatherId === 'fog' ? 0.8 : 0.84, weatherId === 'fog' ? 0.86 : 0.9, u), ek = mix(1, emberK, far);      // (under the fog sky the extra is gone by u 0.86 and the glow drawn in to the ring: it lay over the throat as khaki haze)            // from u 0.9 the ring itself fills the view: no extra there
      glowDeep.uniforms.uIntensity.value = 2.6 * gl * (1.4 - 0.4 * sstep(0.74, 0.86, u)) * mix(1, 0.75 * ek, far); glowDeep.uniforms.uSize.value = mix(26, 44, far);
      glowHigh.uniforms.uIntensity.value = 0.25 * gl * (1 - sstep(0.9, 0.95, u));
      hero.setSeat(null, gl * ek * (1 - 0.45 * sstep(0.9, 0.96, u)));
      // our own bow wave: a white V running up the wall from just astern of the eye. No dark contact patch: with the ride
      // off there is no hull here, and with it on the prow covers the place.
      const cr = Math.hypot(camPol.x, camPol.z);
      if (u < 0.895 && cr > 58) { hero.surfaceAt(cr, Math.atan2(camPol.z, camPol.x), undefined, wakePos); camera.getWorldDirection(aft); aft.negate(); wakePos.addScaledVector(aft, 1.6); hero.setWake(0, wakePos, 0.9, 1 - 0.6 * sstep(0.66, 0.72, u), aft, 0); }      // fainter once the gaze turns to the throat and the water astern comes into frame
      else hero.setWake(0, null, 0);
      fauna.update(dt, time, camera, u);
      set.update(dt, time, camera);
    }
    // ---------- entry apron: a body of water under the run-in ----------
    // Seen through the previous world's portal, the lower part of the opening lies under our sea level, and the engine's
    // portal camera clips the sea surface in front of the opening: that left the hero's near-black inner shell bare (a
    // black crescent in the ring). This sloping sheet, 3 - 8.5 m down between surface and shell, gives those rays lit
    // water to land on. From above it only shows faintly through the surface, as the colour of the water body.
    {
      const th0 = Math.atan2(pts[0].z, pts[0].x), nT = 24, rr = [318, 327, 336, 352, 370, 400, 430, 460], yy = [-3, -3.9, -4.9, -6.6, -8.5, -8.5, -8.5, -8.5];
      const pos = [], fade = [], idx = [];
      for (let j = 0; j < rr.length; j++) for (let i = 0; i <= nT; i++) {
        const e = i / nT * 2 - 1, th = th0 + e * 1.1; pos.push(Math.cos(th) * rr[j], yy[j], Math.sin(th) * rr[j]);
        fade.push(sstep(318, 336, rr[j]) * (1 - sstep(430, 460, rr[j])) * (1 - sstep(0.7, 1, Math.abs(e))));
      }
      for (let j = 0; j < rr.length - 1; j++) for (let i = 0; i < nT; i++) { const a = j * (nT + 1) + i, c = a + nT + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
      const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ag.setAttribute('aFade', new THREE.Float32BufferAttribute(fade, 1)); ag.setIndex(idx);
      ag.computeBoundingSphere();
      const apron = new THREE.Mesh(ag, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uNoise: U.uNoise, uTime: U.uTime, uDeep: U.uDeep, uBottle: U.uBottle, uAmb: U.uAmb, uFoam: U.uFoam, uSkyCool: U.uSkyCool },
        fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute float aFade; varying vec3 vW; varying float vFade;
          #include <fog_pars_vertex>
          void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vFade = aFade; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          precision highp float;
          uniform sampler2D uNoise; uniform float uTime; uniform vec3 uDeep, uBottle, uAmb, uFoam, uSkyCool;
          varying vec3 vW; varying float vFade;
          #include <fog_pars_fragment>
          void main() {
            float n = texture2D(uNoise, vW.xz * 0.011 + vec2(uTime * 0.005, 0.0)).g, m = texture2D(uNoise, vW.xz * 0.037 - vec2(0.0, uTime * 0.009)).g;
            float lace = smoothstep(0.6, 0.78, n * 0.6 + m * 0.52);
            vec3 col = (uBottle * 0.9 + uSkyCool * 0.1) * (0.7 + 0.6 * n) + uFoam * uAmb * 0.3 * lace;
            col = mix(uDeep * 0.5, col, vFade);
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }`,
      }));
      apron.name = 'entry-apron'; scene.add(apron);
    }
    await ctx.yield();
    placeLeader(0, 0); placeBoat2(0, 0); placeBoat3(0, 0, pts[0]); placeRowers(0, 0); placeOrbiters(0, 0, pts[0]); placeLipWreck(0, 0); placeSwimmers(0, 0, pts[0]); placeRafts(0, pts[0]);   // first poses, before the first update
    await sky.prewarm(ctx.renderer, null, scene);

    // ---------- POST: exposure, bloom, grade ----------
    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 40, bank: 2.4, sway: 0.8 },      // bank 2.4: the roll is about two thirds of the wall's slope (16 - 32 degrees), so the water visibly climbs to port and falls to the pit
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFE6B8', glow: 1, tilt: true, revealDistance: 420, halo: false },   // halo off: the engine's 18 m halo disc is cut by the shaft wall 6.6 m away
      post: { exposure: HR.exposure * (weatherId === 'fog' ? 1.04 : 1), bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.1, tint: HR.tint, shadowTint: HR.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'sailing-prow',
      info: { weatherId, hourId, wreckKind, swimmerKind, fishKind, birdId, rare, uG0, uG1, fish0, fish1, uSeal, length: LEN },
      update,
      dispose() { hero.dispose(); if (sky.dispose) sky.dispose(); },
    };
  },
};
