// HERO SET PIECE for "scale-tree-mire" (The Forest before Flowers, 310 million years ago):
// THE COLONNADE AND THE FLOOD. Forty Lepidodendron scale trees, 35 m diamond-barked poles forking in twos into
// bottlebrush crowns, stand in two loose rows in black mirror water; a cream sheet flood then crosses the nave.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), setProgress(u), setFront(z), dispose, ... }
// FRAME (hero-local metres): the nave runs along -Z. The camera enters at z = +220 (brief s = 0) and flies toward
//   -Z; brief distance s maps to z = 220 - s. Left of the flight is -X (the river, the flood's source), right is
//   +X (the sun). y = 0 is the water surface. The 40 Colonnade trunks stand at x ~ -7 and +7 for z = +150..-150,
//   the lone tree of the entry frame (a giant, scale 1.24) at (-2.7, 168), the fallen tree's foot at (-12, -227) leaning over the nave
//   into the fork of a Sigillaria at (+8, -227); the portal belongs at (0, 8, -260).
// OPTS: palette (7 hex, brief order: peat water, bark, moss/leaf, steam, cream silt, jade silt, amber accent),
//   detail (0.6..1: thins shafts, juveniles and the creature's mound litter only; the 40 trees never thin),
//   sunDir ([x,y,z] hero-local, toward the sun; default the brief's 68 deg up on the right),
//   sunColor / skyFill (linear rgb arrays: what a white matte surface shows in sun / in shade; the water and the
//   mirror are unlit shaders and need telling), sky { zenith, horizon, wall } hex for the analytic reflection,
//   shafts (true), creatures (true), obstacles ([[x, z, r], ...] extra trunks or mounds the flood should split round).
// PROGRESS: hero.setProgress(u) with the journey's u (0..1): moves the flood front by the brief's keys, raises
//   the light thrown up from the silt (bark, leaves), and walks the Arthropleura out of the water and onto its mound (its head
//   reaches the pose at ARTH_U = 0.568; anchors.arthropleura gives the body's centre and head there).
//   Until it is first called the piece shows u = 0.5 (front in mid-nave) so it is never seen without its event.
//   hero.setFront(z) places the nave crossing directly. Nothing is keyed to wall-clock time except ambient loops.
// LIGHTING: bark, leaves, mounds and creatures are MeshStandard/Lambert with injected detail: they take the
//   world's own sun + hemisphere + fog. Expect a high sun on +X, a strong hemisphere (olive ground colour before
//   the flood) and fog. No lights are created here.
// DRAW ORDER: the water is in the transparent pass at renderOrder -20 (it does not write depth), the mirror
//   doubles at -19, shafts at +4. Do not put an opaque floor between y = -40 and 0 inside the Colonnade (it
//   would hide the doubles); world transparents should keep renderOrder >= -18.
//   The water is a grid of 30 m cells out to 450 m, not one huge quad: across a triangle whose corners lie kilometres outside the
//   view a rasteriser's depth drifts by centimetres, and floating litter, wakes and mound rims were being drawn under the water.
//   Bark takes U.uLog (1 = a fallen, sodden log: low-contrast diamonds, moss on top only); roots (kind 1) are plain Stigmaria;
//   sk.cell sets the diamond size of a kind-0 tube (default 0.2 m). The Arthropleura's stage (its mound and hummock) is a finer
//   cut of the dome with three fern tufts at its far edge; mound ferns are bent pinnate strips (frond branch of the leaf shader).
// ANCHORS (hero-local): entry { position, direction }; portalSeat { position [0,8,-260], facing (tipped back 6 deg), radius 7 };
//   flyThrough: 14 points, the brief's journey (3 m level, the climb to 12 m, 2 m at the front, 1.2 m in the dart, the last
//   67 m straight and rising 6 deg under the leaning trunk). NOTE the brief itself passes trunks at 2.5-5 m, mounds lower:
//   the line clears every trunk by >= 5.4 m except the lone entry tree (2.5 m, by design) and the leaning trunk (4.1 m overhead);
//   viewpoints { entryFrame, crownLook, floodFront, arthropleura, doorway }: { from, lookAt, progress } for the five must-work frames;
//   loneTree, fallenTree { foot, fork, direction, perch }, sigillaria, arthropleuraMound, breach (where the pale line first shows),
//   perches [{ position, normal, tree }] (a griffinfly already sits on each), trunks [[x, z, radius, height]], mounds [[x, z, r]],
//   extent { xMin, xMax, zMin, zMax, naveHalfWidth, crownBase, top }, flood { fieldKx, flow, speedSideways }.
// ALSO RETURNED: water (the plane mesh), shafts, griffinflies { body, wings, count, place(i, pos, outward, roll), setMatrix(i, m),
//   setFlap(i, 0..1) }, uniforms (all shared uniform holders, e.g. uniforms.uSunCol, uSkyFill/uFill, uShaftK, uFront), floodFrontAt(u).
//   More opts: extraTrees [{ x, z, s?, rot?, juvenile? }] and extraSigillaria [{ x, z, s? }] add the world's own trees to the same
//   instanced meshes (bark, brushes, doubles, mounds, flood obstacles: about 2.9k triangles per adult), spareGriffinflies (n extra
//   hidden instances for the world to fly), bounce (multiplier on the built-in light from below, default 1), rain (0..1: rain rings on the water),
//   shaftMod (0..1, default 1: how far the canopy shade between the 23 bars of light dims the sun on bark, mounds, ferns and water).
// FIXED BY DESIGN (not by seed): the trunks at row 0 #1 (perched griffinfly, z 140), row 1 #5 and #6 (basking log beside them) and row 1 #14
//   (the Arthropleura's tree, at 7.4, -75.4, its first root turned toward the nave) stand on marks, so the beats beside them hold on
//   every seed; anchors.flyThrough is the artist's first line, the world now lays its own from these marks.
// EXPORTS for the world coder: scaleTreeSkeleton, tessellateTree, scaleTreeFoliage, makeBarkMaterial, makeFoliageMaterial,
//   moundGeometry, moundHeight, trunkRadiusAt, makeObstacleTexture, floodFrontAt, arthropleuraGeometry, makeArthropleura (creature on a route),
//   griffinflyGeometry, makeGriffinflies.
// SIZE AND COST: Colonnade 300 m x 30 m x 37 m; whole piece spans z +222..-262. radius 62 / center (0, 9, -40) are the viewer's
//   framing of its heart, not the full extent (see anchors.extent). About 126-130k triangles (seed), 22-23 draw calls, 7 shader
//   programs, one 256x512 R8 texture, about 50 ms of build JS with no step over ~11 ms. No lights, no render targets.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1A1208', '#5F6B4C', '#3E6A2F', '#C9D6A0', '#E0D4AE', '#BCD2BA', '#E8A23A'];
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------
// Mound profile shared by the tree roots, the mound mesh and the creature that climbs it.
export function moundHeight(r, R = 2.6, h = 0.62) { const t = clamp(r / R, 0, 1.6); return h * Math.exp(-t * t * 1.9) - 0.34 * smoothstep(0.75, 1.6, t); }

// ---------------------------------------------------------------------------------------------------------
// Scale tree skeleton: a list of tubes { P:[Vector3], R:[radius], kind (0 trunk, 1 root, 2 limb), level } plus
// the twig tips { p, d } where the bottlebrushes and cones go. All in tree space: y = 0 is the water line.
export function scaleTreeSkeleton(rng, o = {}) {
  const H = o.height ?? 35, juvenile = !!o.juvenile, fork = juvenile ? H : H * 0.8, tubes = [], tips = [];
  const r0 = o.girth ?? 0.75, rTop = r0 * 0.53;
  // trunk: dead straight, a whisper of sway, flare at the foot
  const ys = [-0.9, -0.2, 0.25, 0.7, 1.3, 2.2, 3.6, 6, 9.5, 14, 19, 24, fork];
  const swA = rng() * TAU, swB = rng() * TAU, P = [], R = [];
  for (const y of ys) {
    const t = clamp(y / fork, 0, 1), s = 0.1 * Math.sin(t * 2.6 + swA) * t;
    P.push(V3(s * Math.cos(swB), y, s * Math.sin(swB)));
    R.push(rTop + (r0 * 0.96 - rTop) * Math.pow(1 - t, 1.25) + r0 * 0.5 * Math.exp(-Math.max(y, -0.2) / 0.75));
  }
  tubes.push({ P, R, kind: 0, level: 0 });
  // four Stigmaria roots, forking in twos, riding the mound and running out flat like spokes
  const a0 = rng() * TAU, rootY = (r, rad) => Math.max(moundHeight(r) + rad * 0.55, 0.0 - Math.max(0, r - 5.0) * 0.16);
  const rootTube = (a, rA, rB, radA, radB, bend, level) => {
    const P = [], R = [], n = level === 2 ? 2 : 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = lerp(rA, rB, t), aa = a + bend * t * t, rad = lerp(radA, radB, t);
      P.push(V3(Math.cos(aa) * r, rootY(r, rad) + (level === 0 && i === 0 ? 0.5 : 0), Math.sin(aa) * r)); R.push(rad);
    }
    tubes.push({ P, R, kind: 1, level });
    return a + bend;
  };
  const spokes = [];
  for (let k = 0; k < 4; k++) {
    const a = a0 + k * TAU / 4 + rng.range(-0.22, 0.22); spokes.push(a);
    const e1 = 2.3 + rng() * 0.5, a1 = rootTube(a, r0 * 0.55, e1, r0 * 0.5, r0 * 0.3, rng.range(-0.08, 0.08), 0);
    for (const s of [-1, 1]) {
      const e2 = e1 + 1.6 + rng() * 0.7, a2 = rootTube(a1, e1 - 0.1, e2, r0 * 0.27, r0 * 0.18, s * rng.range(0.24, 0.4), 1);
      for (const s2 of [-1, 1]) rootTube(a2, e2 - 0.1, e2 + 1.5 + rng() * 1.3, r0 * 0.16, 0.03, s2 * rng.range(0.14, 0.26), 2);
    }
  }
  // crown: fork in two, five times; each fork turns the splitting plane about a quarter turn
  const top = P[P.length - 1].clone(), UP = V3(0, 1, 0);
  if (juvenile) {
    for (let y = 1.6, k = 0; y < H; y += 0.42, k++) {
      const a = k * 2.4, t = y / H, r = rTop + (r0 - rTop) * (1 - t), d = V3(Math.cos(a), 0.55 + t * 0.9, Math.sin(a)).normalize();
      tips.push({ p: V3(Math.cos(a) * r * 0.8, y, Math.sin(a) * r * 0.8), d, cone: false });
    }
    tips.push({ p: top.clone(), d: UP.clone(), cone: false }); return { tubes, tips, height: H, fork, spokes, juvenile }; }
  const LEN = [3.3, 2.5, 1.9, 1.45, 1.05], SPREAD = [0.52, 0.5, 0.46, 0.42, 0.38];
  const limb = (p, dir, side, rad, level) => {
    const L = LEN[level] * rng.range(0.85, 1.15) * (H / 35), out = V3(p.x, 0, p.z);
    if (out.lengthSq() < 0.01) out.copy(side); out.normalize();
    const d0 = dir.clone().applyAxisAngle(side, SPREAD[level] * rng.range(0.85, 1.15)).normalize();
    // keep the umbrella shallow and open: pull toward 35 degrees above level, outward
    const want = out.multiplyScalar(0.82).add(V3(0, 0.57, 0)), d1 = d0.clone().lerp(want, 0.16 + 0.05 * level).normalize();
    const d2 = d1.clone().lerp(UP, 0.2).normalize();
    const pm = p.clone().addScaledVector(d0, L * 0.5), pe = pm.clone().addScaledVector(d1, L * 0.5);
    const re = rad * 0.8;
    tubes.push({ P: [p.clone(), pm, pe], R: [rad, (rad + re) * 0.5, re], kind: 2, level });
    if (level === 4) { tips.push({ p: pe, d: d2 }); tips.push({ p: p.clone().addScaledVector(d0, 0.25), d: pe.clone().sub(p).normalize(), cone: false, cards: 2, len: L / 1.75, wid: 0.9, side: true }); return; }
    if (level === 3) tips.push({ p: p.clone().addScaledVector(d0, 0.3), d: pe.clone().sub(p).normalize(), cone: false, cards: 2, len: L / 1.75, wid: 0.8, side: true });
    const ax = d1.clone().cross(side).normalize().applyAxisAngle(d1, rng.range(-0.45, 0.45));
    limb(pe, d2, ax, re * 0.95, level + 1); limb(pe, d2, ax.clone().negate(), re * 0.95, level + 1);
  };
  const ax0 = V3(Math.cos(a0 + 0.6), 0, Math.sin(a0 + 0.6));
  limb(top, UP, ax0, rTop * 0.9, 0); limb(top, UP, ax0.clone().negate(), rTop * 0.9, 0);
  return { tubes, tips, height: H, fork, spokes, juvenile };
}

// Trunk radius of a skeleton at height y (tree space), for seating things on the bark.
export function trunkRadiusAt(sk, y) {
  const tb = sk.tubes[0];
  for (let i = 1; i < tb.P.length; i++) if (y <= tb.P[i].y) return lerp(tb.R[i - 1], tb.R[i], clamp((y - tb.P[i - 1].y) / (tb.P[i].y - tb.P[i - 1].y), 0, 1));
  return tb.R[tb.R.length - 1];
}

// Tessellate a skeleton. lod 0: full (bark attributes); lod 1: the 300-triangle mirror double.
// Attributes: position, normal, aUV (x = lattice cells round the tube, y = cells along it, z = cells in one turn), aAxis (tube direction),
// aInfo (x = kind, y = radius).
export function tessellateTree(sk, lod = 0) {
  const pos = [], nor = [], uv = [], axis = [], info = [], idx = [];
  const t = V3(), a = V3(), b = V3(), px = V3(), n = V3();
  for (const tb of sk.tubes) {
    if (lod && tb.kind === 1) continue;                       // roots are not mirrored
    if (lod && tb.kind === 2 && tb.level > 2) continue;
    const pole = tb.P.length > 4, nP = tb.P.length;
    const sides = lod ? (pole ? 6 : 3) : pole ? (tb.kind === 3 ? 14 : sk.fine ? 24 : 16) : tb.kind === 1 ? (sk.fine ? [14, 9, 5] : [8, 5, 3])[tb.level] : tb.kind === 3 ? 10 : [8, 6, 5, 4, 3][tb.level];
    const N = tb.kind === 3 ? Math.round(TAU * tb.R[0] / 0.17) : Math.max(6, 3 * Math.round(TAU * tb.R[0] / ((tb.kind === 0 ? (sk.cell || 0.2) : 0.13) * 3))), cellW = TAU * tb.R[0] / N;
    const pick = lod ? (pole ? [1, (nP / 3) | 0, ((2 * nP) / 3) | 0, nP - 1] : [0, nP - 1]) : tb.kind === 2 && tb.level >= 3 ? [0, 2] : null;
    let P = pick ? pick.map((i) => tb.P[i]) : tb.P, R = pick ? pick.map((i) => tb.R[i]) : tb.R;
    if (sk.fine && !lod && tb.kind === 1) {                    // sk.fine: a root is a smooth curve through its points, not three straight pieces
      const cv = new THREE.CatmullRomCurve3(tb.P), nS = tb.P.length - 1, m = nS * 3; P = []; R = [];
      for (let i = 0; i <= m; i++) { const f = (i / m) * nS, i0 = Math.min(Math.floor(f), nS - 1); P.push(cv.getPoint(i / m)); R.push(lerp(tb.R[i0], tb.R[i0 + 1], f - i0)); }
    }
    let v = 0; const base = pos.length / 3; px.set(1, 0, 0);
    for (let i = 0; i < P.length; i++) {
      const q0 = P[Math.max(0, i - 1)], q1 = P[Math.min(P.length - 1, i + 1)];
      t.subVectors(q1, q0).normalize();
      if (Math.abs(t.dot(px)) > 0.95) px.set(0, 0, 1);
      a.copy(px).addScaledVector(t, -px.dot(t)).normalize(); px.copy(a); b.crossVectors(t, a);
      if (i > 0) v += P[i].distanceTo(P[i - 1]) / (cellW * 1.55);
      for (let j = 0; j <= sides; j++) {
        const th = (j / sides) * TAU, cs = Math.cos(th), sn = Math.sin(th);
        // root crests are a little flattened; trunk foot is gently fluted where the roots leave it
        let r = R[i];
        if (tb.kind === 0 && !lod) r *= 1 + 0.085 * Math.cos(4 * (th - (sk.spokes[0] || 0))) * Math.exp(-Math.max(P[i].y, 0) / 1.1);
        n.set(0, 0, 0).addScaledVector(a, cs).addScaledVector(b, sn);
        pos.push(P[i].x + n.x * r, P[i].y + n.y * r, P[i].z + n.z * r); nor.push(n.x, n.y, n.z);
        uv.push((j / sides) * N, v, N); axis.push(t.x, t.y, t.z); info.push(tb.kind, R[i]);
      }
    }
    const W = sides + 1;
    for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < sides; j++) {
      const p0 = base + i * W + j, p1 = p0 + 1, p2 = p0 + W, p3 = p2 + 1;
      idx.push(p0, p1, p2, p1, p3, p2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (!lod) {
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3));
    g.setAttribute('aAxis', new THREE.Float32BufferAttribute(axis, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 2));
  }
  g.setIndex(idx);
  return g;
}

// Bottlebrush twigs and hanging cones for one tree, baked from its twig tips.
// Attributes: position, normal (soft, twig-ward), aCard (x across -1..1, y along 0..1, z = 0 leaf card | 1 cone),
// aPivot (xyz twig base, w phase) for the nod. lod 1: one flat card per twig for the mirror double.
export function scaleTreeFoliage(sk, rng, lod = 0) {
  const pos = [], nor = [], card = [], piv = [], idx = [];
  const a = V3(), b = V3(), q = V3(), n = V3();
  for (const tip of sk.tips) {
    const d = tip.d, L = (sk.juvenile ? 0.9 : 1.75) * rng.range(0.85, 1.15) * (tip.len ?? 1), W = (sk.juvenile ? 0.3 : 0.58) * rng.range(0.9, 1.1) * (tip.wid ?? 1), ph = rng() * TAU;
    a.set(-d.z, 0, d.x); if (a.lengthSq() < 1e-4) a.set(1, 0, 0); a.normalize(); b.crossVectors(d, a);
    if (lod && tip.side) continue;
    const cards = lod || tip.flat ? 1 : tip.cards ?? 3, base0 = tip.p.clone().addScaledVector(d, -0.15);
    for (let c = 0; c < cards; c++) {
      const th = tip.flat ? 0 : ph + (c / cards) * Math.PI, cs = Math.cos(th), sn = Math.sin(th), i0 = pos.length / 3;
      q.set(0, 0, 0).addScaledVector(a, cs).addScaledVector(b, sn);
      n.crossVectors(q, d).multiplyScalar(0.35).add(d).addScaledVector(V3(0, 1, 0), 0.6).normalize();
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        const w = W * (lod ? 0.75 : 1);
        pos.push(base0.x + q.x * u * w + d.x * v * L, base0.y + q.y * u * w + d.y * v * L, base0.z + q.z * u * w + d.z * v * L);
        nor.push(n.x, n.y, n.z); card.push(u, v, 0); piv.push(base0.x, base0.y, base0.z, ph);
      }
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
    if (lod || tip.cone === false) continue;
    // cone: a slim bipyramid 0.3 m long hanging from the twig tip
    const tp = tip.p.clone().addScaledVector(d, L * 0.82), i0 = pos.length / 3, cl = 0.34 * rng.range(0.85, 1.2), cr = 0.06;
    const ring = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    pos.push(tp.x, tp.y + 0.02, tp.z); nor.push(0, 1, 0); card.push(0, 0, 1); piv.push(base0.x, base0.y, base0.z, ph);
    for (const [x, z] of ring) { pos.push(tp.x + x * cr, tp.y - cl * 0.38, tp.z + z * cr); nor.push(x, 0.1, z); card.push(x, 0.4, 1); piv.push(base0.x, base0.y, base0.z, ph); }
    pos.push(tp.x, tp.y - cl, tp.z); nor.push(0, -1, 0); card.push(0, 1, 1); piv.push(base0.x, base0.y, base0.z, ph);
    for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; idx.push(i0, i0 + 1 + k1, i0 + 1 + k, i0 + 5, i0 + 1 + k, i0 + 1 + k1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (!lod) {
    g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 3));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(piv, 4));
  }
  g.setIndex(idx);
  return g;
}

// Root mound: a low peat dome 5 m across, lumpy, with a ragged skirt that dips under the water.
// Vertex colour: r = moss/fern cover, g = litter speckle seed, b = wet rim.
export function moundGeometry(rng, noise, rings = 8, seg = 18) {
  const fine = rings > 8 ? 1 : 0, pos = [], col = [], idx = [], ox = rng() * 50, oz = rng() * 50;
  pos.push(0, moundHeight(0) + 0.02, 0); col.push(0.3, rng(), 0);
  for (let i = 1; i <= rings; i++) for (let j = 0; j < seg; j++) {
    const th = (j / seg) * TAU + i * 0.17, rr = (i / rings) * 4.1 * (1 + 0.16 * noise.n2(ox + Math.cos(th) * 1.3, oz + Math.sin(th) * 1.3));
    const x = Math.cos(th) * rr, z = Math.sin(th) * rr, lump = noise.n2(ox + x * 0.9, oz + z * 0.9) * 0.09 + noise.n2(ox + x * 2.7, oz + z * 2.7) * 0.035;
    const y = moundHeight(rr) + (fine ? lump * 0.6 + noise.n2(ox + x * 5.5, oz + z * 5.5) * 0.025 : lump) * smoothstep(4.1, 2.0, rr);
    pos.push(x, y, z);
    col.push(clamp(0.5 + noise.n2(ox + x * 0.6 + 9, oz + z * 0.6) * 0.7, 0, 1), rng(), 1 - smoothstep(0.0, 0.16, y));
  }
  for (let j = 0; j < seg; j++) idx.push(0, 1 + (j + 1) % seg, 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < seg; j++) {
    const p0 = 1 + (i - 1) * seg + j, p1 = 1 + (i - 1) * seg + (j + 1) % seg, p2 = p0 + seg, p3 = p1 + seg;
    idx.push(p0, p1, p2, p1, p3, p2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the piece (D3D-safe: no pow of negatives, no unguarded divisions).
const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
`;

// Where the sun comes down between the crowns: a bar of light at every trunk station, falling on the left row or the right in
// turn, so each row has its trunks lit and shadowed alternately (uShaftP[k] = x, z, half width, half depth of the lit ground; k counts down the nave). A point is carried down the sun's own slant to the water (uSunG = sun.xz / sun.y)
// and asked whether it stands in a bar. The steam shafts, the lit sides of the trunks and the pools on the water all use it.
const N_SHAFT = 26, SHAFT_DZ = 15.789;
// Marks the world's flight is laid from (polish 1: the three close passes now fall ON the frames a visitor is most likely to keep:
// the perch at u 0.16, the basking log at u 0.34, the Arthropleura at u 0.61), so each stands one station from where it was first set.
export const LONE_Z = 168, PERCH_Z = 140, ARTH_Z = -75.4;
// The fallen tree stands 33 m short of the ring (it was 25): we pass under it at u 0.93, so the doorway is the picture at u 0.87 and
// the last frames before the crossing hold the ring alone, with no trunk cut by the corner of the frame.
export const FALL_Z = -227;                      // one bar at every trunk station of the Colonnade, left and right in turn
// uKeyBar = x, z, radius, gain: one pool of extra sun wherever the world stages a portrait (the basking log), in every weather.
export const GLSL_SHAFT = /* glsl */`
uniform vec4 uShaftP[${N_SHAFT}]; uniform vec2 uSunG; uniform float uShaftMod; uniform vec4 uKeyBar;
float keyBar(vec3 P){ vec2 kd = (P.xz - uKeyBar.xy) / max(uKeyBar.z, .1); return uKeyBar.w * (1. - smoothstep(.35, 1., length(kd))); }
float shaftField(vec3 P){ vec2 g = P.xz - uSunG * max(P.y, 0.);
  int k = int(clamp(floor((150. + ${SHAFT_DZ / 2} - g.y) / ${SHAFT_DZ}), 0., ${N_SHAFT - 1}.)); vec4 sp = uShaftP[k];
  return (1. - smoothstep(sp.z * .55, sp.z, abs(g.x - sp.x))) * (1. - smoothstep(sp.w * .55, sp.w, abs(g.y - sp.y))); }
`;
const SHAFT_LIGHT = `#include <lights_fragment_end>
        { vec3 sfP = SHAFT_POS; float sfk = mix(1., mix(.3, 1.5, shaftField(sfP)), uShaftMod) + keyBar(sfP) SHAFT_HIGH; reflectedLight.directDiffuse *= sfk; reflectedLight.directSpecular *= sfk; }`;

// Bark: MeshStandardMaterial (so it takes the world's sun, hemisphere and fog) with the diamond lattice injected.
// Two crossing helices a = u + v, b = u - v cut the tube into diamonds; each is a raised cushion with a dark leaf
// scar above its centre and a pale rim; moss by height and noise, a wet tide stain to 1 m. kind 3 = Sigillaria ribs.
export function makeBarkMaterial(U, pal) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBark = { value: new THREE.Color(pal[1]) }; sh.uniforms.uMoss = { value: new THREE.Color(pal[2]) };
    sh.uniforms.uWaterY = U.uWaterY; sh.uniforms.uBounce = U.uBounce; sh.uniforms.uBounceCol = U.uBounceCol; sh.uniforms.uFill = U.uFill;
    sh.uniforms.uShaftP = U.uShaftP; sh.uniforms.uSunG = U.uSunG; sh.uniforms.uShaftMod = U.uShaftMod; sh.uniforms.uKeyBar = U.uKeyBar; sh.uniforms.uLog = U.uLog || { value: 0 };
    sh.uniforms.uWetSheen = U.uWetSheen; sh.uniforms.uWetDir = U.uWetDir;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aUV; attribute vec3 aAxis; attribute vec2 aInfo;
        varying vec3 vBUV; varying vec3 vAxisV; varying vec2 vBInfo; varying vec3 vBW;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 bw = vec4(transformed, 1.); vec3 bax = aAxis;
        #ifdef USE_INSTANCING
          bw = instanceMatrix * bw; bax = mat3(instanceMatrix) * bax;
        #endif
        vBW = (modelMatrix * bw).xyz; vAxisV = mat3(modelViewMatrix) * bax; vBUV = aUV; vBInfo = aInfo;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uBark, uMoss, uBounceCol, uFill, uWetSheen, uWetDir; uniform float uWaterY, uBounce, uLog;
        varying vec3 vBUV; varying vec3 vAxisV; varying vec2 vBInfo; varying vec3 vBW;
        ${GLSL_NOISE}${GLSL_SHAFT}`)
      .replace('#include <lights_fragment_end>', SHAFT_LIGHT.replace('SHAFT_POS', 'vBW').replace('SHAFT_HIGH', ''))
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bFw = fwidth(vBUV.x) + fwidth(vBUV.y), bFade = (1. - smoothstep(.22, .62, bFw)) * (1. - smoothstep(40., 90., length(vViewPosition)));
        float bN = max(vBUV.z, 1.), bSig = step(2.5, vBInfo.x);
        float ba = vBUV.x + vBUV.y, bb = vBUV.x - vBUV.y;
        if (bSig > .5) { ba = vBUV.x; bb = vBUV.y * .9 + floor(vBUV.x) * .5; }
        vec2 bc = vec2(fract(ba), fract(bb)) - .5;
        float bh = h31(vec3(mod(floor(vec2(ba, bb)), bN), bN));
        float be = .5 - max(abs(bc.x), abs(bc.y));
        if (bSig > .5) be = min(.5 - abs(bc.x), .22);                         // ribs: only the flanks fall away
        float macro = vn3(vBW * vec3(.8, .22, .8)), fine = vn3(vBW * 9.), hy = vBW.y - uWaterY;
        float bRoot = step(.5, vBInfo.x) * (1. - step(1.5, vBInfo.x));                                  // roots are Stigmaria: smooth, small round pits
        // old bark: the leaf cushions are lost at the foot of a scale tree (its lowest two metres are furrowed, stained and mossy)
        // and weather away in patches higher up, so the snakeskin is broken and never one lattice from top to bottom
        float bPole = (1. - bSig) * (1. - uLog) * (1. - bRoot);
        float bFoot = (1. - smoothstep(2.6, 4.2, hy + (macro - .5) * 1.2)) * bPole;
        float bPatch = smoothstep(.55, .7, vn3(vBW * vec3(.45, .2, .45) + 13.)) * bPole;
        float bOld = max(bFoot, bPatch * .9);
        float bSoft = max(max(bRoot, uLog * .93), bOld);                                                 // a fallen log is sodden
        float fur = vn2(vec2(vBUV.x * 1.9 + macro * 2., mix(vBW.y * .3, vBUV.y * .07, bRoot)));
        float cush = smoothstep(.0, .3, be);
        float rimP = smoothstep(.03, .06, be) * (1. - smoothstep(.08, .15, be));
        vec2 dl = mix(vec2(bc.x + bc.y, bc.x - bc.y), bc * 2., bSig);
        float dotS = (1. - smoothstep(mix(.1, .05, bRoot), mix(.2, .13, bRoot), length(dl - vec2(0., .1)))) * (1. - .3 * bRoot) * (1. - .8 * uLog) * (1. - .85 * bOld) * mix(1., .55 * step(.6, bh), bRoot);
        vec2 bg = abs(bc.x) > abs(bc.y) || bSig > .5 ? vec2(-sign(bc.x), 0.) : vec2(0., -sign(bc.y));
        float slope = smoothstep(0., .04, be) * (1. - smoothstep(.12, .32, be)) * (1. - .92 * bSoft);
        vec2 gxy = mix(vec2(bg.x + bg.y, bg.x - bg.y), vec2(bg.x * 1.4, 0.), bSig) * slope * (1. - uLog) * (1. - bRoot);
        vec3 colr = mix(vec3(dot(uBark, vec3(.3, .55, .15))), uBark, .62) * (.74 + .5 * macro);
        colr = mix(colr, vec3(.078, .07, .052) * (.7 + .6 * macro), uLog * .92) * (1. - .08 * bRoot);
        colr = mix(colr, vec3(.115, .1, .068) * (.75 + .5 * macro), bRoot * .5);                    // Stigmaria: brown-olive limbs, never the green of the fronds
        { float furK = smoothstep(.36, .62, fur); colr *= 1. - bFoot * (.12 + .34 * furK) - bPatch * (1. - bFoot) * (.28 * furK - .1) - bRoot * (.1 + .3 * furK); }
        colr *= 1. - bFoot * min(uWetSheen.g * 1.4, .5);                              // in rain the wet foot goes darker still                // furrows in the old bark
        float bPlain = max(uLog * .8, bRoot);                                           // a sodden log and a Stigmaria root carry no lattice at all
        vec3 det = colr * (mix(.42, .86, bSoft) + mix(.78, .16, bSoft) * (1. - bPlain) * cush + .1 * bPlain);
        det = mix(det, colr * 1.45 + .012, rimP * .13 * (1. - bSoft));
        det *= (1. - .58 * dotS) * mix(.7 + .56 * bh, 1., max(max(uLog * .75, bOld * .7), bRoot * .85));
        // relief that holds in any light: every cushion carries a lit flank toward the sun and a shadowed one away from it, and
        // the lattice between cushions is a dark wet groove (it was a pale rim, which read as a wire grid)
        { vec3 bNn = normalize(vNormal), bTa0 = vAxisV - bNn * dot(vAxisV, bNn); bTa0 = bTa0 / max(length(bTa0), 1e-4); vec3 bTc0 = cross(bTa0, bNn);
          vec2 bLt = vec2(.5, .8);
          #if NUM_DIR_LIGHTS > 0
            bLt = mix(bLt, vec2(dot(directionalLights[0].direction, bTc0), dot(directionalLights[0].direction, bTa0) + .35), .75);
          #endif
          bLt = bLt / max(length(bLt), .3);
          float bRel = clamp(-(gxy.x * bLt.x + gxy.y * bLt.y), -1., 1.);
          det *= 1. + (bRel > 0. ? .7 : .5) * bRel;
          det *= 1. - .5 * (1. - smoothstep(0., .07, be)) * (1. - bSoft); }
        // a three-cell lattice carries the snakeskin three times further than the diamonds themselves
        vec2 bc3 = vec2(fract(ba / 3.), fract(bb / 3.)) - .5;
        float groove3 = (1. - smoothstep(0., .1, .5 - max(abs(bc3.x), abs(bc3.y)))) * (1. - bSig) * (1. - bOld) * (1. - .8 * uLog);
        float coarse = (1. - smoothstep(.22, .62, bFw / 3.)) * (1. - bFade);
        // beyond the reach of the diamonds the bark is a mottle of patches three cushions across with a faint lattice, not a grid
        float b3h = h31(vec3(floor(ba / 3.), floor(bb / 3.), 7.)), b3m = mix(1., .8 + .36 * b3h, coarse * (1. - bSig) * (1. - bOld));
        vec3 bcol = mix(colr * .97 * b3m * (1. - .2 * groove3 * coarse), det, bFade);
        bcol *= mix(1., (.6 + .8 * vn2(vec2(vBUV.x * 2.9 + macro * 3., vBUV.y * .21))) * (.8 + .4 * vn2(vec2(vBUV.x * 7.3, vBUV.y * .6 + 5.))), bPlain);
        // a fallen log: sodden and dark whatever the light, split by long cracks, with paler weathered patches where the bark has gone
        { float crk = 1. - smoothstep(.0, .09, abs(vn2(vec2(vBUV.x * 4.3 + macro * 2., vBUV.y * .16 + 3.)) - .5));
          float bare = smoothstep(.58, .7, vn2(vec2(vBUV.x * .9 + 4., vBUV.y * .23)) + .2 * fine);
          bcol *= mix(1., (.62 - .34 * crk) * (1. + .75 * bare), uLog); }          // long wet fibres down a log, furrows down a root
        float lichen = smoothstep(.56, .8, vn3(vBW * vec3(.9, .33, .9) + 3.) + .12 * bPatch * (1. - bFoot));
        float streak = vn2(vec2(vBUV.x * .4, vBW.y * .07));
        bcol = mix(bcol, bcol * 1.55 + vec3(.025, .027, .02), lichen * .55) * (.6 + .75 * streak) * (.84 + .32 * vn2(vec2(vBW.y * .9, vBUV.x * .06)));
        float mossN = vn3(vBW * vec3(1.4, .45, 1.4) + 7.);
        float moss = smoothstep(.6, .84, mossN + .42 * exp(-max(hy, 0.) / 2.5) - .3 * smoothstep(8., 22., hy) - .04 * bRoot + .1 * bOld);
        moss *= mix(1., 1. - .55 * cush * (1. - bRoot) * (1. - bOld), bFade);
        vec3 bUp = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz); float bTop = dot(normalize(vNormal), bUp);
        moss = mix(moss, smoothstep(.5, .78, mossN * .7 + vn3(vBW * 3.1) * .5) * smoothstep(.15, .8, bTop), uLog);
        vec3 bMossC = mix(uMoss, vec3(dot(uMoss, vec3(.3, .55, .15))) * vec3(1.08, 1., .7), .42);
        bcol = mix(bcol, bMossC * (.45 + .6 * fine) * (1. - .25 * bRoot) * (1. - .4 * bFoot), moss * mix(.8, .5, bRoot));
        bcol *= mix(1., mix(.5, 1.25, smoothstep(-.3, .75, bTop)), max(bRoot, uLog * .6));     // a root is a rounded limb: lit top, wet dark underside
        float stain = 1. - smoothstep(.7, 1.2, hy + .3 * mossN);
        bcol *= 1. - .42 * stain * (1. - .45 * uLog);
        float bWet = max(stain * .8, .45 * step(.5, vBInfo.x) * (1. - step(1.5, vBInfo.x)));
        diffuseColor.rgb = bcol;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(.86, mix(.42, .66, bFoot), bWet) + .1 * fine * (1. - bWet);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 bTa = vAxisV - normal * dot(vAxisV, normal); bTa = bTa / max(length(bTa), 1e-4);
          vec3 bTc = cross(bTa, normal);
          normal = normalize(normal - (bTc * gxy.x + bTa * gxy.y) * (.95 * bFade) + (vec3(fine) - .5) * .12 * bFade); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // light thrown up from the silted water: strongest on faces that look down, fading up the pole
        { vec3 upV = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz);
          float under = .35 + .65 * clamp(.5 - .5 * dot(normal, upV), 0., 1.);
          float bTopK = max(dot(normal, upV), 0.), bRim = 1. - abs(dot(normal, normalize(vViewPosition))); bRim = bRim * bRim * (.4 + .6 * bRim * bRim);
          vec3 keyTop = vec3(0.);
          #if NUM_DIR_LIGHTS > 0
            keyTop = directionalLights[0].color * (keyBar(vBW) * .32 * (.2 + .8 * bTopK));        // the staged pool of sun lies on whatever is under it
          #endif
          // rain: wet bark carries a cool sheen down the side that faces the break in the cloud
          vec3 wetS = uWetSheen * bRim * (.35 + .65 * clamp(dot(normal, normalize((viewMatrix * vec4(uWetDir, 0.)).xyz)) * .7 + .5, 0., 1.)) * (1. - .6 * moss);
          totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * (uBounce * under * exp(-max(hy, 0.) / 14.) * (1. - .9 * uLog) * (1. - .75 * bFoot)) + uFill * (.5 + .3 * bFoot) * (1. - .4 * uLog) + keyTop) + wetS * (1. - .85 * bFoot); }`);
  };
  m.customProgramCacheKey = () => 'stm-bark';
  return m;
}

// Bottlebrush leaves and cones: Lambert (takes the world's lights and fog), needles cut out of crossed cards,
// nodding in the vertex shader; thin needles thicken to a solid serrated brush with distance so they never sparkle.
export function makeFoliageMaterial(U, pal) {
  const m = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uLeaf = { value: new THREE.Color(pal[2]) }; sh.uniforms.uLeafHi = { value: new THREE.Color(pal[3]) };
    sh.uniforms.uBounce = U.uBounce; sh.uniforms.uBounceCol = U.uBounceCol;
    sh.uniforms.uShaftP = U.uShaftP; sh.uniforms.uSunG = U.uSunG; sh.uniforms.uShaftMod = U.uShaftMod; sh.uniforms.uKeyBar = U.uKeyBar;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aCard; attribute vec4 aPivot; uniform float uTime; varying vec3 vCard; varying float vFPh; varying vec3 vFW;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 fw = vec4(transformed, 1.);
          #ifdef USE_INSTANCING
            fw = instanceMatrix * fw;
          #endif
          vFW = (modelMatrix * fw).xyz; }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float al = clamp(length(transformed - aPivot.xyz) / 1.3, 0., 1.);
          float sw = sin(uTime * 1.1 + aPivot.w + aPivot.x * .4) * .07 + sin(uTime * 2.3 + aPivot.w * 2.) * .03;
          transformed.x += sw * al; transformed.z += cos(uTime * .9 + aPivot.w) * .05 * al; transformed.y -= abs(sw) * al * .5;
          vCard = aCard; vFPh = aPivot.w; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uLeaf, uLeafHi, uBounceCol; uniform float uBounce; varying vec3 vCard; varying float vFPh; varying vec3 vFW;
        ${GLSL_NOISE}${GLSL_SHAFT}`)
      .replace('#include <lights_fragment_end>', SHAFT_LIGHT.replace('SHAFT_POS', 'vFW').replace('SHAFT_HIGH', '; sfk = mix(sfk, 1.15, smoothstep(12., 24., vFW.y))'))
      .replace('#include <color_fragment>', `#include <color_fragment>
        float fRowW = fwidth(vCard.y * 44. - abs(vCard.x) * 10.), fFrW = fwidth(vCard.y * 15. - abs(vCard.x) * 2.6);
        if (vCard.z < .5) {
          float au = abs(vCard.x), v = vCard.y;
          float row = v * 44. - au * 10. + vFPh;
          float nh = h21(vec2(floor(row), floor(vFPh * 40.)));
          float tipR = max(v - .72, 0.) / .28;
          float env = min(1., v * 7. + .25) * (1. - tipR * tipR) * (.72 + .28 * nh);
          float wid = mix(.3, .5, smoothstep(.1, .4, fRowW));
          float needle = step(abs(fract(row) - .5), wid * (1. - .45 * au));
          float stem = step(au, .07);
          if (max(needle * step(au, env), stem * step(v, .9)) < .5) discard;
          vec3 lc = mix(uLeaf * .5, mix(uLeaf * 1.15, uLeafHi, .22), smoothstep(.0, .95, au)) * (.8 + .4 * nh);
          diffuseColor.rgb = mix(lc, vec3(.09, .075, .04), stem * .8);
        } else if (vCard.z > 1.5) {
          // a tree-fern frond: lance-shaped, cut into pinnae swept toward the tip, every pinna scalloped into pinnules; solid when too far to resolve
          float au = abs(vCard.x), v = vCard.y, sv = sin(clamp(v, 0., 1.) * 3.1416);
          float outline = (.16 + .84 * sqrt(max(sv, 0.))) * (1. - .45 * v * v), rel = au / max(outline, .05);
          float pr = v * 15. - au * 2.6 + vFPh, pf = abs(fract(pr) - .5) * 2.;
          float lace = (.82 - .5 * rel) * (.6 + .4 * abs(sin(au * 27.)));
          float rachis = step(au, .045);
          if ((rel > 1. || pf > mix(lace, 1.1, smoothstep(.3, .9, fFrW))) && rachis < .5) discard;
          vec3 ol = uLeaf * vec3(1.02, .9, .6);
          diffuseColor.rgb = mix(ol * .5, ol * 1.2 + uLeafHi * .08, rel) * (.78 + .44 * h21(vec2(floor(pr), floor(vFPh * 40.))));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.1, .08, .04), rachis * .7);
        } else {
          float sc = fract(vCard.y * 6. + abs(vCard.x) * .5);
          diffuseColor.rgb = mix(vec3(.16, .13, .06), vec3(.36, .33, .16), smoothstep(.15, .6, sc));
        }`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        normal = normalize(vNormal);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 fV = normalize(vViewPosition); float back = 0.; vec3 lcol = vec3(0.);
          #if NUM_DIR_LIGHTS > 0
            back = max(dot(-fV, directionalLights[0].direction), 0.); lcol = directionalLights[0].color;
          #endif
          totalEmissiveRadiance += diffuseColor.rgb * lcol * (back * back * .3) * (vCard.z > 1.5 ? .7 : max(1. - vCard.z, 0.))
            + diffuseColor.rgb * uBounceCol * uBounce * .8; }`);
  };
  m.customProgramCacheKey = () => 'stm-leaf';
  return m;
}

// ---------------------------------------------------------------------------------------------------------
// The flood. One scalar field in hero-local metres: F = -z + x / tan(10 deg) (+ a constant); the water at a
// point is silt where F < uFront. The front is therefore a line slanted 10 degrees to the nave, flooded side
// left (-x) and behind (+z), and its nave crossing runs down the nave as uFront grows. Lobed by two noises and
// held back round every obstacle (distance texture), so it splits at each mound and closes behind it.
const KX = 5.6713, KN = 5.7588;                    // 1 / tan(10 deg), |grad F|
const GLSL_FLOOD = /* glsl */`
uniform float uTime, uFront; uniform sampler2D uObst; uniform vec4 uObstBox;
const vec2 FLOW = vec2(.9848, -.1736);             // the way the sheet travels (local x, z)
float obstDist(vec2 p){ vec2 uv = (p - uObstBox.xy) * uObstBox.zw; return textureLod(uObst, uv, 0.).r * 12.; }
// metres behind the front, measured square to it (> 0 flooded)
float floodBehind(vec2 p, float od){
  float F = -p.y + p.x * ${KX.toFixed(4)};
  float lobes = (vn2(p * .085 + vec2(uTime * .02, 0.)) - .5) * 30. + (vn2(p * .36 - vec2(0., uTime * .07)) - .5) * 9. + (vn2(p * 1.15 + vec2(3., uTime * .11)) - .5) * 4.2;
  float held = (1. - smoothstep(0., 5., od)) * 12.;
  return (uFront - F + lobes - held) / ${KN.toFixed(4)};
}`;

// Distance-to-nearest-obstacle texture (R8, 12 m range). obstacles: [[x, z, r], ...] in hero-local metres.
function stampObstacle(data, W, Hh, sx, sz, box, ox, oz, r) {
  const i0 = Math.max(0, Math.floor((ox - r - 12 - box.x0) / sx)), i1 = Math.min(W - 1, Math.ceil((ox + r + 12 - box.x0) / sx));
  const j0 = Math.max(0, Math.floor((oz - r - 12 - box.z0) / sz)), j1 = Math.min(Hh - 1, Math.ceil((oz + r + 12 - box.z0) / sz));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const dx = box.x0 + (i + 0.5) * sx - ox, dz = box.z0 + (j + 0.5) * sz - oz;
    const v = Math.round(clamp((Math.hypot(dx, dz) - r) / 12, 0, 1) * 255), k = j * W + i;
    if (v < data[k]) data[k] = v;
  }
}
function obstacleTextureFrom(data, W, Hh) {
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}
export function makeObstacleTexture(obstacles, box) {
  const W = 256, Hh = 512, data = new Uint8Array(W * Hh).fill(255), sx = (box.x1 - box.x0) / W, sz = (box.z1 - box.z0) / Hh;
  for (const [ox, oz, r] of obstacles) stampObstacle(data, W, Hh, sx, sz, box, ox, oz, r);
  return obstacleTextureFrom(data, W, Hh);
}
// the same texture made in short steps (a frame handed back every eight obstacles), for build()
async function makeObstacleTextureSteps(obstacles, box, yieldFn) {
  const W = 256, Hh = 512, data = new Uint8Array(W * Hh).fill(255), sx = (box.x1 - box.x0) / W, sz = (box.z1 - box.z0) / Hh;
  for (let k = 0; k < obstacles.length; k++) { const [ox, oz, r] = obstacles[k]; stampObstacle(data, W, Hh, sx, sz, box, ox, oz, r); if (k % 8 === 7 && yieldFn) await yieldFn(); }
  return obstacleTextureFrom(data, W, Hh);
}

const WATER_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vL;
void main(){
  vL = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WATER_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_FLOOD}
${GLSL_SHAFT}
uniform vec3 uCamL, uSunDir, uSunCol, uSkyFill, uPeat, uCream, uJade, uSkyZen, uSkyHor, uWall, uGapDir, uGapCol;
uniform float uRain;
uniform vec4 uTrunk[60];
varying vec3 vL;
vec3 skyRefl(vec3 R, vec2 p){
  vec3 s = mix(uSkyHor, uSkyZen, smoothstep(0., .55, R.y));
  { float gd = max(dot(R, uGapDir), 0.), gd2 = gd * gd, gd8 = gd2 * gd2 * gd2 * gd2; s += uGapCol * (gd8 * gd8 * gd8 * .26 + gd8 * .08); }   // the break in the cloud (rain)
  float trav = 30. / max(R.y, .04); vec2 h = p + R.xz * trav;            // where the reflected ray meets the canopy
  float wall = smoothstep(150., 300., trav) * max(smoothstep(.04, .3, abs(R.x)), 1. - smoothstep(-330., -290., h.y));
  float slot = smoothstep(10., 24., abs(h.x) + (vn2(h * .12) - .5) * 16.);
  float can = slot * smoothstep(.3, .56, vn2(h * .075)) * (1. - smoothstep(200., 320., trav));
  float farK = smoothstep(60., 220., trav);
  can = mix(can, .55 * slot * (1. - smoothstep(200., 320., trav)), farK);
  return mix(s, uWall * (.8 + .5 * vn2(h * .31) * (1. - farK)), max(wall * .9, can * .82)) * .86;
}
// one trunk: x = bright crests of the V (a short train of ripples that wanders, breaks into dashes and dies within a dozen
// metres: never a ruled bar), y = calm lee inside the V, z = the dark trough inside each arm
vec3 wake(vec2 p, vec4 tr, float dist){
  vec2 rel = p - tr.xy; float al = dot(rel, FLOW), cr = dot(rel, vec2(-FLOW.y, FLOW.x)), r = max(tr.z, .05);
  float d = length(rel) - r, a0 = max(al, 0.), sd = cr < 0. ? -1. : 1.;
  float arm = r * .85 + a0 * .5 + min(2.2, r * 1.1) * (1. - exp(-a0 / 4.));             // a short steep V close behind the trunk, then the long slant
  arm += (vn2(vec2(al * .33 - uTime * .12, sd * 3.7 + tr.x * .9)) - .5) * (.3 + a0 * .11) + (vn2(vec2(al * 1.3 - uTime * .5, sd * 9.1 + tr.y)) - .5) * .22;
  float wdt = .13 + a0 * .028, wl = wdt + min(.0006 * dist * dist, .3), dd = abs(cr) - arm, x = dd / wl;
  float env = smoothstep(-r * .2, r * .6, al) * exp(-a0 / 9.5);
  float brk = .25 + .75 * smoothstep(.34, .62, vn2(vec2(al * .55 - uTime * .7, sd * 5.3 + tr.x)));     // the crest stands in pieces
  float chev = .5 + .5 * sin(al * 3.2 - uTime * 3. + abs(cr) * 2.) * vn2(vec2(al * .8 - uTime, cr * 2.));
  float x1 = x - 2.6, x2 = x - 5.;
  float line = (exp(-x * x * 1.4) + .42 * exp(-x1 * x1 * 1.6) + .2 * exp(-x2 * x2 * 1.8)) * env * brk;
  float xt = x + 1.7; float trough = exp(-xt * xt * .9) * env * (.4 + .6 * brk);          // dark water inside each arm
  float bow = (1. - smoothstep(0., .5, d)) * (1. - smoothstep(-.6, .3, al / max(r, .2)));
  float lee = (1. - smoothstep(arm - wl - wdt * 3., arm - wl, abs(cr))) * step(0., al) * exp(-a0 / 10.) * smoothstep(0., .6, d);
  lee *= .4 + .6 * smoothstep(-.2, .2, sin(cr * 9. / (1. + a0 * .05) + 2. * sin(al * .7 - uTime * .9)));      // streaks drawn out down the lee
  return vec3(line * (.6 + .4 * chev) + bow * .8, lee, trough) * step(.06, tr.z);
}
void main(){
  vec2 p = vL.xz; vec3 toC = uCamL - vL; float dist = length(toC); vec3 V = -toC / max(dist, 1e-3);
  float t = uTime, od = obstDist(p), dm = floodBehind(p, od), fl = smoothstep(0., .22, dm);
  // --- ripples, rings from falling cones and marsh gas
  float nearK = 1. - smoothstep(30., 160., dist);
  vec2 rp = p * .55 + vec2(t * .05, t * .035);
  float n0 = vn2(rp), nx = vn2(rp + vec2(.3, 0.)), nz = vn2(rp + vec2(0., .3));
  vec2 rp2 = p * 2.3 - vec2(t * .11, -t * .07);
  float m0 = vn2(rp2), mx = vn2(rp2 + vec2(.3, 0.)), mz = vn2(rp2 + vec2(0., .3));
  vec2 g = vec2(n0 - nx, n0 - nz) * .5 + vec2(m0 - mx, m0 - mz) * .22 * nearK;
  vec2 cell = floor(p / 7.); float ch = h21(cell), ch2 = h21(cell + 17.3);
  vec2 cp = (cell + .5 + (vec2(ch, ch2) - .5) * .4) * 7.; float rd = length(p - cp), ph = fract(t * .11 + ch * 7.);
  float ring = sin((rd - ph * 3.) * 8.) * exp(-abs(rd - ph * 3.) * 2.2) * (1. - ph) * step(ch2, .7) * (1. - fl);
  g += (p - cp) / max(rd, 1e-3) * ring * .5 * nearK * (1. - .75 * uRain);
  float rainK = 1. - smoothstep(10., 30., dist);                // rain rings: soft, of mixed sizes, near us; a fine stipple beyond
  for (int k = 0; k < 2; k++) {                                   // rain (opts.rain): two turned layers of small quick rings, each cell
    float sc = k == 0 ? .9 : 2.9;                               // with its own place, size and beat, four in ten left empty
    vec2 pr = k == 0 ? p : vec2(p.x * .8 + p.y * .6, p.y * .8 - p.x * .6) + 31.7;
    vec2 c2 = floor(pr / sc); float r1 = h21(c2 + 5.1), r2 = h21(c2 + 11.7), r3 = h21(c2 + 23.9);
    vec2 q2 = (c2 + .5 + (vec2(r1, r2) - .5) * .5) * sc; float d2 = length(pr - q2), ph2 = fract(t * (.5 + .7 * r3) + r1 * 9.), rad = ph2 * sc * (.07 + .3 * r2 * r2);
    float ring2 = sin((d2 - rad) * (13. + 16. * r3)) * exp(-abs(d2 - rad) * 6.) * (1. - ph2) * step(r3, .5) * (.5 + .9 * r1);
    vec2 dr = (pr - q2) / max(d2, 1e-3); if (k == 1) dr = vec2(dr.x * .8 - dr.y * .6, dr.y * .8 + dr.x * .6);
    g += dr * ring2 * 2.3 * uRain * rainK; }
  g += (vec2(vn2(p * 5.3 + t * 2.1), vn2(p * 5.3 - t * 1.7 + 9.)) - .5) * .3 * uRain * smoothstep(8., 30., dist) * nearK;
  g *= 1. + 3. * (1. - smoothstep(0., 1.6, abs(dm)));               // the water shivers at the lip
  vec3 N = normalize(vec3(g.x * (.16 + 1.2 * fl), 1., g.y * (.16 + 1.2 * fl)));
  float c = clamp(dot(-V, N), 0., 1.), fr = .25 + .75 * pow(1. - c, 3.5);
  vec3 R = reflect(V, N); R.y = abs(R.y);
  vec3 sky = skyRefl(R, p);
  float sd = max(dot(R, uSunDir), 0.), sd2 = sd * sd, sd8 = sd2 * sd2 * sd2 * sd2, sd32 = sd8 * sd8 * sd8 * sd8, glint = sd32 * sd32 * (.25 + .75 * smoothstep(.45, .75, vn2(p * 2.6 + vec2(t * .7, -t * .4))));
  // --- light on the surface: bars of sun between the crowns, olive shade elsewhere
  float bars0 = smoothstep(.42, .66, vn2(vec2(p.x * .045 + 3., p.y * .16)) * .75 + vn2(p * .31) * .25);
  float bars = mix(bars0, max(shaftField(vec3(p.x, 0., p.y)) * (.8 + .4 * vn2(p * .9 + t * .1)), bars0 * .4 * smoothstep(9., 18., abs(p.x))), uShaftMod);
  vec3 lightD = uSunCol * .62 * bars + uSkyFill * .95;
  // --- black mirror with floating litter and cones
  vec2 lc = floor(p * 11.); vec2 lj = vec2(h21(lc + 3.), h21(lc + 9.)) - .5;
  // loose flecks lying every way, each its own size, two in three cells empty (they were a ruled grid of dots)
  float la = h21(lc + 13.) * 6.283; vec2 lq = fract(p * 11.) - .5 - lj * .7; lq = vec2(lq.x * cos(la) + lq.y * sin(la), lq.y * cos(la) - lq.x * sin(la));
  float lsh = 1. - smoothstep(.1, .24, length(lq * vec2(1., 1.9 + 1.6 * lj.x)) / (.55 + .7 * h21(lc + 29.)));
  float lit = lsh * max(smoothstep(.6, .78, vn2(p * .3 + 11.)) * step(.66, h21(lc + 5.)), step(.975, h21(lc + 41.))) * nearK;
  vec3 body = uPeat * (.9 + .7 * lightD);
  vec3 dark = mix(body, sky, fr) + uSunCol * glint * 3. * nearK;
  dark = mix(dark, mix(vec3(.11, .09, .04), vec3(.26, .28, .13), h21(lc + 7.)) * (lightD + .15), lit);
  // --- silt: three tones (cream, jade, the jade shadow) in feathered bands drawn out along the flow, at four scales, each
  // carried by the one before it. No iso-lines and no cells: every edge is a soft threshold of stretched noise.
  vec2 q = vec2(dot(p, FLOW), dot(p, vec2(-FLOW.y, FLOW.x))); q.x -= t * 1.6;
  float w1 = vn2(q * vec2(.06, .15) + 2.), w2 = vn2(q * vec2(.13, .31) - 5.);
  float nearF = 1. - smoothstep(10., 60., dist);
  vec2 wq = q + (vec2(w1, w2) - .5) * vec2(10., 3.2);
  // polish 2: swirls, not ruled streaks (the bands were six to ten times longer than wide and read as a smear): each scale is
  // about three times longer than wide and is turned by the one before it, like milk stirred into tea
  float b1 = vn2(wq * vec2(.05, .16));
  vec2 sw = wq + vec2(sin(b1 * 6.283 + wq.y * .21), cos(b1 * 6.283 + wq.x * .13)) * 2.4;
  float b2 = vn2(sw * vec2(.12, .36) + 7. + b1 * 1.6);
  float b3 = vn2(vec2(sw.x * .3 - t * .22, sw.y * .95) + 3. + b2 * 1.9);
  float b4 = vn2(vec2(sw.x * .8 - t * .5, sw.y * 2.6) + b3 * 1.6);
  float b5 = vn2(vec2(sw.x * 2.2 - t * .9, sw.y * 6.5) + b4 * 1.2);
  float tone = .5 + (b1 * .46 + b2 * .34 + b3 * .2 - .5) * 1.75 + (b4 - .5) * .1 * nearF;
  vec3 deep = uJade * vec3(.26, .43, .4), jade = uJade * vec3(.62, .86, .8);
  vec3 silt = mix(uCream * .96, jade, smoothstep(.36, .54, tone));
  silt = mix(silt, deep, smoothstep(.54, .68, tone + (b3 - .5) * .14) * .9);
  silt = mix(silt, deep * .7, smoothstep(.7, .9, tone) * .6);
  silt = mix(silt, uCream * 1.1, smoothstep(.56, .8, b3) * smoothstep(.35, .65, b2) * .7);          // cream ribbons riding the jade
  silt = mix(silt, deep * 1.15, smoothstep(.52, .78, b4) * (1. - smoothstep(.35, .65, b2)) * .6 * nearF);  // jade feathers in the cream
  silt *= 1. + ((b4 - .5) * .3 + (b5 - .5) * .16) * nearF + (b3 - .5) * .24;
  // the last dark threads of peat water: long lanes, feathered and broken along their length
  float lane = smoothstep(.5, .7, vn2(vec2(sw.x * .05, sw.y * .26) + 11.));
  float feath = smoothstep(.3, .7, vn2(vec2(sw.x * .22, sw.y * 1.3) + 4. + b2 * 1.4));
  float thr = lane * feath * (.6 + .4 * smoothstep(.3, .7, b4)) * (1. - .35 * smoothstep(4., 60., dm));
  silt = mix(silt, uPeat * 1.7 + deep * .2, thr * .9);
  vec3 wk = vec3(0.);
  float zc = p.y + .1763 * p.x;
  for (int s = 0; s < 2; s++) {
    float xr = s == 0 ? uTrunk[0].x : uTrunk[20].x, z0 = s == 0 ? uTrunk[0].y : uTrunk[20].y, z1 = s == 0 ? uTrunk[19].y : uTrunk[39].y;
    float fi = clamp((z0 - (zc - .1763 * xr)) / max(z0 - z1, 1.) * 19., 0., 19.);
    int i0 = int(floor(fi)), i1 = min(i0 + 1, 19);
    wk += wake(p, uTrunk[s * 20 + i0], dist); wk += wake(p, uTrunk[s * 20 + i1], dist);
  }
  for (int k = 40; k < 60; k++) wk += wake(p, uTrunk[k], dist);
  wk = min(wk, vec3(1.3, 1., 1.));
  float ringF = (1. - smoothstep(.0, .7, od)) * (.5 + .5 * sin(od * 14. - t * 4.));
  silt = mix(silt, deep * .62, wk.y * .7);                              // the darker lee streak inside each V
  silt = mix(silt, mix(silt, deep, .6) * .62, min(wk.z, 1.) * .8);
  silt = mix(silt, uCream * 1.55 + .03, min(wk.x * .85 + ringF * .3, 1.));
  float wkGlit = wk.x * step(.8, h21(floor(p * 9.))) * (1. - smoothstep(.15, .45, length(fract(p * 9.) - .5))) * (.5 + .5 * sin(t * 6. + h21(floor(p * 9.) + 3.) * 40.));     // the bright standing arms and the bow pillow
  // sun glitter: flecks drawn out along the flow where the cream ribbons run, twinkling
  float glit = smoothstep(.7, .9, vn2(vec2(wq.x * 2.1 - t * 1.4, wq.y * 15.) + b3 * 2.)) * smoothstep(.5, .75, b3) * (.45 + .55 * sin(t * 5. + b5 * 40.)) * nearF;
  vec3 wetS = mix(silt * (uSunCol * .6 * mix(.42, 1.0, bars) + uSkyFill * .9), sky * .9, clamp(fr * .62 - .1, 0., .5)) + uSunCol * (glint * 1.1 + max(glit, 0.) * (.35 + 1.5 * bars) + wkGlit * (.25 + .9 * bars));
  // --- the lip: a hard bright curl with glitter, a dark line under it
  float lipW = .16 + .5 * vn2(p * .9 + vec2(t * .3, 0.));
  float lip = smoothstep(0., .05, dm) * (1. - smoothstep(.06, lipW, dm)) * (.3 + .7 * smoothstep(.32, .62, vn2(p * 1.9 - FLOW * t * .5 + 7.)));
  lip += smoothstep(.5, .78, vn2(p * 3.1 - FLOW * t * .8)) * smoothstep(.56, .7, vn2(p * 9.7 + t * .4)) * (1. - smoothstep(.2, 2.6, dm)) * step(0., dm) * .5;      // lace of foam trailing behind the curl
  float sparkle = step(.86, h21(floor(p * 7.))) * (.5 + .5 * sin(t * 5. + h21(floor(p * 7.) + 5.) * 40.)) * (1. - smoothstep(.12, .4, length(fract(p * 7.) - .5)));
  float underLip = (1. - smoothstep(0., .5, -dm)) * step(dm, 0.);
  float tg1 = vn2(p * .42 + vec2(-t * .25, t * .08)), tg2 = vn2(p * 1.5 + vec2(-t * .5, 3.));
  float fing = vn2(vec2(dot(p, FLOW) * .22 - t * .35, dot(p, vec2(-FLOW.y, FLOW.x)) * 1.6));
  float thin = smoothstep(0., 1., (dm - .1) / (.7 + 2.6 * tg1 * fing + .7 * tg2));
  vec3 tea = mix(dark, wetS * vec3(.66, .54, .4), .3 + .35 * fing);
  vec3 col = mix(dark * (1. - .5 * underLip), mix(tea, wetS, thin), fl);
  col += uCream * uSunCol * lip * (.7 + 4.5 * sparkle * (.4 + .6 * bars));
  gl_FragColor = vec4(min(col, vec3(2.4)), 1.);
  #include <fog_fragment>
}`;

function makeWaterMaterial(FU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...FU }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
    fog: true, transparent: true, depthWrite: false,
  });
}

// The doubles in the black water: y-flipped low copies of every trunk and crown, drawn after the water plane.
// Each fragment finds where its sight line crosses the surface and asks the flood field there, so the mirror
// goes out exactly where the silt has arrived; ripples wobble it; Fresnel fades it underfoot.
function makeMirrorMaterial(FU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...FU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 aCol; varying vec3 vL; varying vec3 vN; varying vec3 vC; varying float vAbove;
      uniform float uTime; uniform vec3 uCamL;
      void main(){
        vec4 lp = vec4(position, 1.); vec3 n = normal;
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
        #endif
        float dep = clamp(-lp.y, 0., 40.), amp = .035 + .02 * min(dep, 12.);
        lp.x += sin(dep * 1.9 + uTime * 1.4 + lp.z * .6) * amp;
        lp.z += sin(dep * 1.3 - uTime * 1.1 + lp.x * .5) * amp * .7;
        vAbove = lp.y; lp.y = min(lp.y, -.002);
        vec4 mvPosition = modelViewMatrix * lp;
        // lay the double on the surface where its sight line crosses it: same picture, but nothing under the
        // water can hide it and anything above the water still can
        vec3 S = uCamL + (lp.xyz - uCamL) * (uCamL.y / max(uCamL.y - lp.y, 1e-3)); S.y = .004;
        vL = S; vN = n; vC = aCol;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(S, 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_FLOOD}
      uniform vec3 uCamL, uSunDir, uSunCol, uSkyFill, uPeat; varying vec3 vL; varying vec3 vN; varying vec3 vC; varying float vAbove;
      void main(){
        if (vAbove > 0.) discard;
        vec3 S = vL, toC = uCamL - S; float dist = length(toC);
        float c = clamp(toC.y / max(dist, 1e-3), 0., 1.), fr = .16 + .84 * pow(1. - c, 3.5);
        float od = obstDist(S.xz), dm = floodBehind(S.xz, od), fl = smoothstep(-.3, .22, dm);
        vec3 n = vN / max(length(vN), 1e-4);
        float sun = max(dot(n, vec3(uSunDir.x, -uSunDir.y, uSunDir.z)), 0.);
        vec3 col = mix(uPeat * (.6 + .5 * uSkyFill), vC * (uSkyFill * 1.1 + uSunCol * sun * .9), fr);
        gl_FragColor = vec4(col, (1. - .5 * fl) * .96 * (1. - .35 * smoothstep(40., 160., dist)) * smoothstep(.15, 1.7, -vAbove));
        #include <fog_fragment>
      }`,
  });
}

// Shafts of steam: crossed additive sheets slanting down the sun's own direction, soft-edged, curling, breathing.
function buildShafts(rng, U, pal, sunDir) {
  const pos = [], nor = [], sh = [], idx = [], top = 34, off = V3(sunDir.x, sunDir.y, sunDir.z).multiplyScalar(top / Math.max(sunDir.y, 0.2));
  for (let k = 0; k < N_SHAFT; k++) {                         // k 1 lights the perch tree (left), k 6 the basking log, k 14 the Arthropleura's mound (right)
    const side = k % 2 ? -1 : 1, z = 150 - k * SHAFT_DZ + rng.range(-1, 1), xb = side * rng.range(2.6, 3.8), w = rng.range(2.4, 3.4), d = rng.range(3.4, 4.6), seed = rng() * 100;
    if (k > 22) { U.uShaftP.value[k].set(0, z, 0.01, 0.01); continue; }                  // none near the ring: it stands against a calm dark bank
    U.uShaftP.value[k].set(side * 6.4, z, 6.6, d);
    for (let kind = 0; kind < 2; kind++) {
      const e = kind === 0 ? V3(w, 0, 0) : V3(0, 0, d * 0.8), n = e.clone().cross(off).normalize(), i0 = pos.length / 3;
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        pos.push(xb + e.x * u + off.x * v, off.y * v - 0.3, z + e.z * u + off.z * v); nor.push(n.x, n.y, n.z); sh.push(u, v, seed, kind);
      }
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aShaft', new THREE.Float32BufferAttribute(sh, 4));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uCamL: U.uCamL, uCol: { value: new THREE.Color(pal[3]) }, uShaftK: U.uShaftK },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aShaft; varying vec4 vS; varying vec3 vL; varying vec3 vN;
      void main(){ vS = aShaft; vL = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      ${GLSL_NOISE}
      uniform float uTime, uShaftK; uniform vec3 uCamL, uCol; varying vec4 vS; varying vec3 vL; varying vec3 vN;
      void main(){
        vec3 toC = uCamL - vL; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
        float e = 1. - vS.x * vS.x; e = e * (.45 + .55 * e);
        float rays = .62 + .38 * vn2(vec2(vS.x * 5. + vS.z, uTime * .04)) + .25 * vn2(vec2(vS.x * 17. - vS.z, uTime * .07));
        float prof = smoothstep(0., .1, vS.y) * (1. - smoothstep(.72, 1., vS.y)) * (.55 + .45 * (1. - vS.y));
        float steam = vn3(vec3(vL.x * .22, vL.y * .16 - uTime * .12, vL.z * .22) + vS.z);
        float curl = vn3(vec3(vL.x * .7 + uTime * .05, vL.y * .5 - uTime * .22, vL.z * .7));
        float mist = 1. + .55 * exp(-max(vL.y, 0.) / 3.5);
        float breath = .8 + .2 * sin(uTime * .45 + vS.z);
        float face = smoothstep(.06, .5, abs(dot(V, vN))), nearF = smoothstep(6., 24., dist);
        float a = e * prof * rays * (.4 + .85 * steam * (.6 + .4 * curl)) * mist * breath * face * nearF * uShaftK;
        gl_FragColor = vec4(uCol * min(a, .95) * .66 * exp(-min(dist, 400.) / 85.), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// Sigillaria: a stout ribbed pole forked once, a mop of drooping leaves on each top (the fallen tree lodges in its fork).
function sigillariaSkeleton(rng, forkY = 16) {
  const tubes = [], tips = [], P = [], R = [];
  for (const y of [-0.8, 0, 0.8, 2.5, 6, 10, 13.5, forkY]) { P.push(V3(0, y, 0)); R.push(0.42 + 0.2 * (1 - y / forkY) + 0.3 * Math.exp(-Math.max(y, 0) / 0.6)); }
  tubes.push({ P, R, kind: 3, level: 0 });
  for (const s of [-1, 1]) {
    const a = V3(0, forkY - 0.3, 0), b = V3(0.1 * s, forkY + 1.3, 0.95 * s), c = V3(0.2 * s, forkY + 2.9, 1.5 * s);
    tubes.push({ P: [a, b, c], R: [0.4, 0.34, 0.27], kind: 3, level: 0 });
    for (let k = 0; k < 16; k++) {
      const th = (k / 16) * TAU + rng() * 0.3, el = k % 2 ? rng.range(-1.0, -0.3) : rng.range(-0.1, 0.7);
      tips.push({ p: c.clone().add(V3(0, -0.1, 0)), d: V3(Math.cos(th), el, Math.sin(th)).normalize(), cone: false, len: 0.85, wid: 1.0 });
    }
  }
  return { tubes, tips, height: forkY + 3, fork: forkY, spokes: [0], juvenile: false };
}

function mirrorGeometry(sk, seed, barkCol, leafCol) {
  const a = tessellateTree(sk, 1), b = scaleTreeFoliage(sk, makeRng(seed), 1);
  const paint = (g, c) => { const n = g.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3); g.setAttribute('aCol', new THREE.BufferAttribute(arr, 3)); };
  paint(a, barkCol); paint(b, leafCol);
  const g = mergeGeometries([a, b]); a.dispose(); b.dispose();
  return g;
}

// Nave crossing of the flood front, keyed to journey progress u (brief: 168 m at u 0.44, under us at 240 m at
// u 0.5, 358 m at u 0.6, past the portal by u 0.83). Returned as uFront = -(local z of the crossing).
// (polish 1: the lip lies 12 m ahead of us at u 0.52 and has closed round the Arthropleura's mound, now at z -77, by u 0.585)
const FRONT_KEYS = [[0, -2000], [0.34, -820], [0.40, -460], [0.44, -52], [0.52, 42], [0.585, 142], [0.62, 172], [0.83, 330], [1, 500]];
export function floodFrontAt(u) {
  const K = FRONT_KEYS; u = clamp(u, 0, 1);
  for (let i = 1; i < K.length; i++) if (u <= K[i][0]) return lerp(K[i - 1][1], K[i][1], (u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
  return K[K.length - 1][1];
}

// ---------------------------------------------------------------------------------------------------------
// buildHero: see the header at the top of this file for the frame, anchors, opts, progress hooks and draw order.
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const root = new THREE.Group(); root.name = 'scale-tree-mire-hero';
  const sunDir = V3(...(opts.sunDir || [0.352, 0.927, -0.128])).normalize();
  const lin = (hex) => new THREE.Color(hex), arr3 = (a, d) => (a ? new THREE.Vector3(a[0], a[1], a[2]) : d);
  const U = {
    uTime: { value: 0 }, uWaterY: { value: 0 }, uBounce: { value: 0 }, uBounceCol: { value: lin(pal[4]) },
    uCamL: { value: V3(0, 3, 200) }, uShaftK: { value: 1 }, uFill: { value: arr3(opts.skyFill, V3(0.3, 0.335, 0.28)) },
    uShaftP: { value: Array.from({ length: N_SHAFT }, () => new THREE.Vector4(0, 0, 1, 1)) }, uSunG: { value: new THREE.Vector2(sunDir.x, sunDir.z).divideScalar(Math.max(sunDir.y, 0.2)) }, uKeyBar: { value: new THREE.Vector4(0, 0, 1, 0) }, uWetSheen: { value: V3(0, 0, 0) }, uWetDir: { value: V3(0, 0.3, -1).normalize() }, uShaftMod: { value: opts.shaftMod ?? 1 },
  };
  const trunkU = []; for (let i = 0; i < 60; i++) trunkU.push(new THREE.Vector4(0, 0, 0, 0));
  let hero_wakes = null;
  const FU = {
    uTime: U.uTime, uFront: { value: floodFrontAt(0.5) }, uObst: { value: null }, uObstBox: { value: new THREE.Vector4() },
    uCamL: U.uCamL, uSunDir: { value: sunDir }, uSunCol: { value: arr3(opts.sunColor, V3(1.02, 0.97, 0.86)) },
    uSkyFill: U.uFill, uPeat: { value: lin(pal[0]) }, uCream: { value: lin(pal[4]) },
    uJade: { value: lin(pal[5]) }, uSkyZen: { value: lin(opts.sky?.zenith || '#E6EAD2') }, uSkyHor: { value: lin(opts.sky?.horizon || '#BFD3DC') },
    uWall: { value: lin(opts.sky?.wall || '#2C3320') }, uTrunk: { value: trunkU }, uRain: { value: opts.rain ?? 0 },
    uGapDir: { value: arr3(opts.gap?.dir, V3(0, 0.2, -1)).normalize() }, uGapCol: { value: arr3(opts.gap?.color, V3(0, 0, 0)) },
    uShaftP: U.uShaftP, uSunG: U.uSunG, uShaftMod: U.uShaftMod, uKeyBar: U.uKeyBar,
  };
  const barkMat = makeBarkMaterial(U, pal), leafMat = makeFoliageMaterial(U, pal), mirrorMat = makeMirrorMaterial(FU);
  const mirBark = lin(pal[1]).multiplyScalar(0.8), mirLeaf = lin(pal[2]).multiplyScalar(0.75);

  // ---- layout (all rng draws for placement happen here, before any yield)
  const NROW = 20, Z0 = 150, DZ = 300 / (NROW - 1), trees = [];   // { x, z, rot, lean, leanDir, s, variant }
  for (let row = 0; row < 2; row++) for (let i = 0; i < NROW; i++) {
    const side = row === 0 ? -1 : 1;
    trees.push({ x: side * (7 + rng.range(-1.1, 2.0)), z: Z0 - i * DZ + rng.range(-2.6, 2.6), rot: rng() * TAU, lean: rng.range(0, 0.011), leanDir: rng() * TAU, s: rng.range(0.93, 1.07), variant: rng.int(0, 2), row, i });
  }
  // Pinned trunks: the beats that pass close to one tree (the perched griffinfly, the basking log, the Arthropleura) must not
  // move with the seed, so those trunks stand on their grid marks whatever was drawn for them (the draws themselves are kept).
  const pin = (row, i, x) => { const t = trees[row * NROW + i]; t.x = x; t.z = Z0 - i * DZ; t.lean = 0; t.s = 1; return t; };
  pin(0, 1, -7.0).z = PERCH_Z; pin(1, 5, 8.0); pin(1, 6, 8.0);
  const arthTree = pin(1, 14, 7.4); arthTree.variant = 0; arthTree.z = ARTH_Z;
  trees[NROW + 13].x = Math.max(trees[NROW + 13].x, 8.3); trees[NROW + 15].x = Math.max(trees[NROW + 15].x, 7.6); trees[NROW + 15].z = Math.min(trees[NROW + 15].z, ARTH_Z - 11.5);
  trees[15].x = -6.4; trees[NROW + 17].x = 6.4; trees[19].x = -6.4;                 // the dart jinks toward these three mounds
  const lone = { x: -2.7, z: LONE_Z, rot: rng() * TAU, lean: 0.004, leanDir: rng() * TAU, s: 1.24, variant: rng.int(0, 2) };
  trees.push(lone);
  const FALL = { foot: V3(-12, 0.25, FALL_Z), fork: V3(8, 16, FALL_Z) };
  const fallDir = FALL.fork.clone().sub(FALL.foot).normalize(), fallen = { variant: rng.int(0, 2), s: 1.0, fallen: true, rot: rng() * TAU };
  trees.push(fallen);
  const nJuv = Math.round(rng.int(3, 6) * detail), juvs = [];
  for (let k = 0; k < nJuv; k++) {
    const side = rng.sign(), i = rng.int(1, NROW - 2);
    juvs.push({ x: side * rng.range(11.5, 15), z: Z0 - (i + 0.5) * DZ + rng.range(-3, 3), rot: rng() * TAU, lean: rng.range(0, 0.03), leanDir: rng() * TAU, s: rng.range(0.85, 1.15) });
  }
  const seeds = [0, 1, 2, 3, 4].map(() => Math.floor(rng() * 1e9));
  // the world's own trees join the same instanced meshes (bark, brushes, doubles, mounds, flood obstacles)
  const xr = rng.fork('extra'), extraSig = [];
  for (const e of opts.extraTrees || []) {
    const t = { x: e.x, z: e.z, rot: e.rot ?? xr() * TAU, lean: e.lean ?? xr.range(0, 0.012), leanDir: xr() * TAU, s: e.s ?? xr.range(0.9, 1.08), variant: xr.int(0, 2), extra: true };
    if (e.juvenile) juvs.push(t); else trees.push(t);
  }
  for (const e of opts.extraSigillaria || []) extraSig.push({ x: e.x, z: e.z, rot: e.rot ?? xr() * TAU, lean: 0, leanDir: 0, s: e.s ?? xr.range(0.85, 1.1) });
  const shaftRng = rng.fork('shafts'), critRng = rng.fork('creatures'), skRng = rng.fork('skeletons');
  await ctx.yield();

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), S = V3(), T = V3(), FLIP = new THREE.Matrix4().makeScale(1, -1, 1);
  const matrixOf = (t, out) => {
    if (t.fallen) {
      Q.setFromUnitVectors(V3(0, 1, 0), fallDir); Q2.setFromAxisAngle(V3(0, 1, 0), t.rot); Q.multiply(Q2);
      return out.compose(FALL.foot, Q, S.set(1, 1, 1));
    }
    Q.setFromAxisAngle(T.set(Math.cos(t.leanDir), 0, Math.sin(t.leanDir)), t.lean); Q2.setFromAxisAngle(V3(0, 1, 0), t.rot); Q.multiply(Q2);
    return out.compose(T.set(t.x, 0, t.z), Q, S.set(t.s, t.s, t.s));
  };
  const instanced = (geo, mat, list, flip) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    list.forEach((t, k) => { matrixOf(t, M); if (flip) M.premultiply(FLIP); im.setMatrixAt(k, M); });
    im.count = list.length; im.instanceMatrix.needsUpdate = true; im.frustumCulled = false;
    if (flip) im.renderOrder = -19;
    root.add(im); return im;
  };

  // ---- three adult variants + one juvenile: bark, bottlebrushes, mirror double
  const skeletons = [];
  for (let v = 0; v < 4; v++) {
    const juv = v === 3, sk = scaleTreeSkeleton(skRng, juv ? { juvenile: true, height: 13, girth: 0.36 } : { height: 33.5 + v * 1.4, girth: 0.72 + 0.04 * v });
    skeletons.push(sk); await ctx.yield();
    if (v === 0) arthTree.rot = sk.spokes[0] - ARTH_SPOKE;                          // its first root runs out toward the nave and away from us
    const list = juv ? juvs : trees.filter((t) => t.variant === v && t !== arthTree);
    const g = tessellateTree(sk, 0); await ctx.yield();
    const f = scaleTreeFoliage(sk, makeRng(seeds[v]), 0); await ctx.yield();
    const mg = mirrorGeometry(sk, seeds[v], mirBark, mirLeaf); await ctx.yield();
    instanced(g, barkMat, list); instanced(f, leafMat, list); instanced(mg, mirrorMat, list, true);
    await ctx.yield();
    if (v === 0) {                                             // the Arthropleura's tree is passed at a metre and a half: its own finer cut
      sk.fine = true; const gf = tessellateTree(sk, 0); sk.fine = false; await ctx.yield();
      instanced(gf, barkMat, [arthTree]); instanced(f, leafMat, [arthTree]); instanced(mg, mirrorMat, [arthTree], true);
      await ctx.yield();
    }
  }

  // ---- the Sigillaria that catches the fallen tree
  const sigSk = sigillariaSkeleton(skRng, FALL.fork.y - 0.55), sigAt = { x: FALL.fork.x, z: FALL.fork.z, rot: 0, lean: 0, leanDir: 0, s: 1 };
  const sigList = [sigAt, ...extraSig];
  instanced(tessellateTree(sigSk, 0), barkMat, sigList); instanced(scaleTreeFoliage(sigSk, makeRng(seeds[4]), 0), leafMat, sigList);
  instanced(mirrorGeometry(sigSk, seeds[4], mirBark, mirLeaf), mirrorMat, sigList, true);
  await ctx.yield();

  // ---- root mounds with a few fern tufts
  const moundMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, vertexColors: true });
  moundMat.onBeforeCompile = (sh) => {
    sh.uniforms.uMoss = { value: lin(pal[2]) }; sh.uniforms.uBounce = U.uBounce; sh.uniforms.uBounceCol = U.uBounceCol; sh.uniforms.uFill = U.uFill;
    sh.uniforms.uShaftP = U.uShaftP; sh.uniforms.uSunG = U.uSunG; sh.uniforms.uShaftMod = U.uShaftMod; sh.uniforms.uKeyBar = U.uKeyBar;
    sh.uniforms.uTime = U.uTime; sh.uniforms.uFront = FU.uFront; sh.uniforms.uObst = FU.uObst; sh.uniforms.uObstBox = FU.uObstBox;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 mw = vec4(transformed, 1.);
        #ifdef USE_INSTANCING
          mw = instanceMatrix * mw;
        #endif
        vMW = (modelMatrix * mw).xyz;`);
    // Peat with moss in separate cushions (16 cm domes, dark peat between), pale cone scales and needle litter that hold up at
    // 3 m, a wet near-black rim at the water and, once the silt has reached this mound, a thin line of foam lapping it.
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform vec3 uMoss, uBounceCol, uFill; uniform float uBounce; varying vec3 vMW;
        ${GLSL_NOISE}${GLSL_FLOOD}${GLSL_SHAFT}`)
      .replace('#include <lights_fragment_end>', SHAFT_LIGHT.replace('SHAFT_POS', 'vMW').replace('SHAFT_HIGH', ''))
      .replace('#include <color_fragment>', `
        float mD = length(vViewPosition), mNear = 1. - smoothstep(6., 18., mD);
        float mn = vn2(vMW.xz * 1.7), mf = vn2(vMW.xz * 9.), mg = vn2(vMW.xz * 31.);
        float dome = smoothstep(.22, .8, vn2(vMW.xz * 11. + mn * 2.5) * .6 + vn2(vMW.xz * 23. + 5.) * .25 + mg * .15);
        vec3 peat = mix(vec3(.085, .064, .036), vec3(.19, .15, .085), mf) * (.8 + .4 * mg);
        float mossK = smoothstep(.36, .72, vColor.r * .7 + mn * .5);
        float cover = mossK * mix(.8, .62 + .38 * smoothstep(-.05, .35, dome + (mossK - .55) * .9), mNear);
        vec3 mossC = mix(vec3(dot(uMoss, vec3(.3, .55, .15))), uMoss, .4) * vec3(1.12, 1., .62) * (.54 + .5 * mf) * mix(1., .84 + .26 * dome, mNear) * (.85 + .3 * mg * mNear);
        vec3 mc = mix(peat, mossC, cover);
        vec2 lp = vMW.xz * 12., lc = floor(lp); float lh1 = h21(lc + 3.1), lh2 = h21(lc + 8.7), la = lh2 * 6.283;
        vec2 lr = fract(lp) - .5 - (vec2(lh1, lh2) - .5) * .36; lr = vec2(lr.x * cos(la) + lr.y * sin(la), lr.y * cos(la) - lr.x * sin(la));
        float scaleK = (1. - smoothstep(.15, .21, length(lr * vec2(1., 1.8)))) * step(.74, lh1);
        float needle = (1. - smoothstep(.018, .045, abs(lr.y))) * step(abs(lr.x), .44) * step(lh1, .24);
        float lFine = 1. - smoothstep(.25, .7, fwidth(lp.x) + fwidth(lp.y));                        // litter goes out before it falls under a pixel
        mc = mix(mc, mix(vec3(.27, .23, .12), vec3(.19, .16, .075), lh2) * (.75 + .5 * mg), scaleK * mNear * .5 * lFine);
        mc = mix(mc, mc * 1.5 + vec3(.03, .027, .014), needle * mNear * .4 * lFine);                   // needles a shade paler than what they lie on: never black or white specks
        float mWet = max(1. - smoothstep(.01, .07 + .06 * mn, vMW.y), vColor.b * .35);
        mc *= 1. - .66 * mWet;
        float mFl = smoothstep(0., .4, floodBehind(vMW.xz, obstDist(vMW.xz)));
        vec3 mUp = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz); float mNu = clamp(dot(normalize(vNormal), mUp), .2, 1.), mSl = sqrt(max(1. - mNu * mNu, 0.)) / mNu;
        float mFoam = (1. - smoothstep(.0, max(.045 * mSl, .004), abs(vMW.y - .012 - .008 * sin(uTime * 2.1 + mn * 9.)))) * mFl * smoothstep(.3, .6, vn2(vMW.xz * 5. + vec2(uTime * .8, 0.)));
        float mBump = dome * cover * .009 * mNear;                 // (litter carries no relief: its sharp edges were turning single pixels black or white)
        diffuseColor.rgb = mc;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(.95, .38, mWet);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float dt = dot(sx, r1);
          vec3 gr = sign(dt) * (dFdx(mBump) * r1 + dFdy(mBump) * r2); normal = normalize(abs(dt) * normal - gr * 1.6 + normal * 1e-6); }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * uBounce * .6 + uFill * .5) + uBounceCol * mFoam * (.22 + .22 * uBounce);');
  };
  moundMat.customProgramCacheKey = () => 'stm-mound';
  const moundList = trees.filter((t) => !t.fallen).concat([{ x: FALL.foot.x - 0.8, z: FALL.foot.z, rot: 1, lean: 0, leanDir: 0, s: 1.05 }, { ...sigAt, s: 0.8 }], extraSig.map((e) => ({ ...e, s: 0.8 * e.s })), juvs.map((j) => ({ ...j, s: 0.5 * Math.min(j.s, 1.2), lean: 0 })));
  const hummock = { x: arthTree.x + ARTH_HUMMOCK[0], z: arthTree.z + ARTH_HUMMOCK[1], rot: 2.2, lean: 0, leanDir: 0, s: ARTH_HUMMOCK[2] };
  moundList.push(hummock);
  // the Arthropleura's stage (its tree's mound and the hummock) is seen from 3 m: a finer cut of the same dome
  const stage = [arthTree, hummock];
  // (polish 2) mounds out in the walls, beyond 16 m from the nave, are a lighter cut of the same dome: the triangles pay for the
  // swarm's bodies and the rounder roots of the Arthropleura's tree
  const moundNear = moundList.filter((t) => !stage.includes(t) && Math.abs(t.x) <= 16), moundFar = moundList.filter((t) => !stage.includes(t) && Math.abs(t.x) > 16);
  instanced(moundGeometry(rng.fork('mound'), noise), moundMat, moundNear);
  if (moundFar.length) instanced(moundGeometry(makeRng(4242), noise, 5, 12), moundMat, moundFar);
  await ctx.yield();
  instanced(moundGeometry(makeRng(9173), noise, 16, 48), moundMat, stage);
  await ctx.yield();
  // ferns on the mounds: tufts of arching pinnate fronds (bent strips for the frond branch of the leaf shader)
  const fernRng = rng.fork('ferns');
  const tuftGeo = (tufts) => {                                  // tufts: [centre, fronds, size]
    const pos = [], nor = [], card = [], piv = [], idx = [], NS = 2;
    for (const [c, n, sz] of tufts) for (let j = 0; j < n; j++) {
      const th = (j / n) * TAU + fernRng() * 0.6, up = fernRng.range(0.7, 1.25), droop = fernRng.range(1.0, 1.7), L = 1.5 * sz * fernRng.range(0.75, 1.15), W = 0.27 * L, ph = fernRng() * TAU;
      const cx = Math.cos(th), sn = Math.sin(th), i0 = pos.length / 3; let x = 0, y = 0;
      for (let i = 0; i <= NS; i++) {
        const t = i / NS, el = up - droop * t;
        if (i > 0) { const e0 = up - droop * (t - 0.5 / NS); x += Math.cos(e0) * L / NS; y += Math.sin(e0) * L / NS; }
        for (const sg of [-1, 1]) {
          pos.push(c.x + cx * x - sn * sg * W, c.y + y - 0.1 * W * (1 - t), c.z + sn * x + cx * sg * W);
          nor.push(-cx * Math.sin(el) * 0.6 - sn * sg * 0.25, 0.8, -sn * Math.sin(el) * 0.6 + cx * sg * 0.25); card.push(sg, t, 2); piv.push(c.x, c.y, c.z, ph);
        }
        if (i < NS) { const q = i0 + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 3)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(piv, 4)); g.setIndex(idx);
    return g;
  };
  const tufts = [];
  for (let k = 0; k < 5; k++) { const a = fernRng() * TAU, r = fernRng.range(1.1, 2.7); tufts.push([V3(Math.cos(a) * r, moundHeight(r) + 0.02, Math.sin(a) * r), fernRng.int(5, 7), fernRng.range(0.55, 1.0)]); }
  const fernList = moundList.filter((t) => !stage.includes(t));                      // the creature's own mound stays clear of them...
  instanced(tuftGeo(tufts), leafMat, fernList);
  await ctx.yield();
  // ...but for three small tufts at the far edge of its stage, away from its line
  const hAtStage = (x, z) => Math.max(moundHeight(Math.hypot(x - arthTree.x, z - arthTree.z)), hummock.s * moundHeight(Math.hypot(x - hummock.x, z - hummock.z) / hummock.s), 0);
  instanced(tuftGeo([[-3.9, -1.25, 0.5], [-2.5, -1.45, 0.62], [-4.4, -1.0, 0.42]].map(([dx, dz, sz]) => [V3(arthTree.x + dx, hAtStage(arthTree.x + dx, arthTree.z + dz) + 0.02, arthTree.z + dz), 6, sz])), leafMat,
    [{ x: 0, z: 0, rot: 0, lean: 0, leanDir: 0, s: 1 }]);
  await ctx.yield();

  // ---- obstacles for the flood: every mound, plus whatever the world adds
  const obstacles = moundList.map((t) => [t.x, t.z, 2.5 * t.s]).concat(opts.obstacles || []);
  const box = { x0: -80, x1: 80, z0: -280, z1: 232 };
  FU.uObst.value = await makeObstacleTextureSteps(obstacles, box, ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();
  FU.uObstBox.value.set(box.x0, box.z0, 1 / (box.x1 - box.x0), 1 / (box.z1 - box.z0));
  const rowsSorted = [0, 1].map((r) => trees.filter((t) => t.row === r).sort((a, b) => a.i - b.i));
  rowsSorted.forEach((list, r) => list.forEach((t, i) => trunkU[r * 20 + i].set(t.x, t.z, 2.5 * t.s, 0)));
  // the wake lookup assumes one x per row: use each trunk's own x but the row mean for the index estimate
  trunkU[40].set(lone.x, lone.z, 2.5 * lone.s, 0); trunkU[41].set(FALL.foot.x - 0.8, FALL.foot.z, 2.6, 0); trunkU[42].set(sigAt.x, sigAt.z, 2.0, 0);
  // the world's own trunks nearest the nave stream their wakes too (the rows that run on past the Colonnade to the ring)
  trees.filter((t) => t.extra).sort((a, b) => Math.abs(a.x) - Math.abs(b.x)).slice(0, 9).forEach((t, i) => trunkU[44 + i].set(t.x, t.z, 2.5 * t.s, 0));
  hero_wakes = (list) => list.slice(0, 7).forEach((w, i) => trunkU[53 + i].set(w[0], w[1], w[2], 0));
  await ctx.yield();

  // ---- water: one huge quad; black mirror, flood front, marble
  // A grid, not one huge quad: a rasteriser interpolates depth badly across a triangle whose corners lie kilometres outside the
  // view, and the litter, wakes and mound rims that sit centimetres above the water were being drawn under it. 30 m cells out to
  // 450 m (the fog is total long before that; the sky below the horizon is the fog's colour).
  const wg = new THREE.BufferGeometry(), WS = 450, WN = 30, wpos = [], widx = [];
  for (let j = 0; j <= WN; j++) for (let i = 0; i <= WN; i++) wpos.push(-WS + (2 * WS * i) / WN, 0, -WS - 40 + (2 * WS * j) / WN);
  for (let j = 0; j < WN; j++) for (let i = 0; i < WN; i++) { const q = j * (WN + 1) + i; widx.push(q, q + WN + 1, q + 1, q + 1, q + WN + 1, q + WN + 2); }
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
  wg.setIndex(widx);
  const water = new THREE.Mesh(wg, makeWaterMaterial(FU)); water.renderOrder = -20; water.frustumCulled = false; root.add(water);
  let shafts = null;
  if (opts.shafts !== false) { shafts = buildShafts(shaftRng, U, pal, sunDir); root.add(shafts); }
  await ctx.yield();

  const critters = [];

  // ---- anchors (hero-local)
  // ---- the Arthropleura on its mound (one, or on some seeds a pair nose to tail)
  let arthRoute = null;
  if (opts.creatures !== false) {
    const route = await moundRoute(skeletons[arthTree.variant], arthTree, () => ctx.yield());
    await ctx.yield();
    const ag = arthropleuraGeometry(critRng, { edge: '#C9A24A' });
    await ctx.yield();
    ag.scale(1.1, 1.1, 1.1); ag.userData.length *= 1.1;                             // a big one: 2.8 m
    const nA = critRng.chance(0.3) ? 2 : 1; arthRoute = route;
    for (let k = 0; k < nA; k++) {
      const A = makeArthropleura(ag, route, U), gap = k * 2.9; root.add(A.mesh);
      await ctx.yield();
      let driven = false, uNow = 0.5;
      const sAt = (u) => clamp(route.pose + (u - ARTH_U) * 46, 2.8, route.length - 3.2);      // about 0.9 m/s past our slowed flight
      critters.push({
        mesh: A.mesh,
        setProgress(u) { uNow = u; },
        drive() { driven = true; },
        update(dt, time) { A.setHead((driven ? sAt(uNow) : route.pose - 2 + ((time * 0.45) % 7)) + (k === 0 ? gap * (nA - 1) : 0)); },
      });
    }
    await ctx.yield();
  }
  const perches = [3, 6, 9, 13].map((i, k) => {
    const t = rowsSorted[k % 2][i], side = t.x < 0 ? 1 : -1, y = 3 + (k % 3) * 0.6, r = trunkRadiusAt(skeletons[t.variant], y / t.s) * t.s;
    return { position: [t.x + side * r, y, t.z], normal: [side, 0, 0], tree: [t.x, t.z] };
  });
  // ---- griffinflies: one perched at each perch, wings flat; spare instances (opts.spareGriffinflies) for the world to fly
  let griffinflies = null;
  if (opts.creatures !== false) {
    const spare = Math.max(0, opts.spareGriffinflies | 0);
    griffinflies = makeGriffinflies(perches.length + spare, U, pal, FU);
    perches.forEach((pc, k) => griffinflies.place(k, pc.position, pc.normal, critRng.range(-0.5, 0.5)));
    root.add(griffinflies.body, griffinflies.wings);
    await ctx.yield();
  }
  const anchors = {
    entry: { position: [0, 3, 220], direction: [0, 0, -1] },
    portalSeat: { position: [0, 8, -260], facing: [0, -0.1045, 0.9945], radius: 7 },
    flyThrough: [[0, 3, 220], [0, 3, 160], [0.5, 3, 124], [-0.8, 7.5, 95], [0.3, 12, 66], [0.8, 7, 36], [-0.5, 3, 9], [0, 2.4, -20],
      [1.4, 2, -48], [0.6, 1.3, -80], [-0.6, 1.2, -140], [0, 1.2, -193], [0, 5.46, -235], [0, 8, -260]],
    viewpoints: {
      entryFrame: { from: [0, 3, 220], lookAt: [lone.x, 12, lone.z] },
      crownLook: { from: [0.3, 12, 66], lookAt: [0, 30, 20] },
      floodFront: { from: [0, 2.4, -20], lookAt: [0, 0.5, -60], progress: 0.5 },
      arthropleura: { from: [arthTree.x - 4.9, 1.7, arthTree.z + 4.2], lookAt: [arthTree.x - 2.5, 0.45, arthTree.z - 0.5], progress: ARTH_U },
      doorway: { from: [0, 3.8, -219], lookAt: [0, 8, -260], progress: 0.95 },
    },
    loneTree: [lone.x, 0, lone.z],
    fallenTree: { foot: FALL.foot.toArray(), fork: FALL.fork.toArray(), direction: fallDir.toArray(), perch: [0, 10.3, FALL_Z] },
    sigillaria: [sigAt.x, 0, sigAt.z],
    arthropleuraMound: [arthTree.x, 0, arthTree.z],
    arthropleura: arthRoute ? { center: arthRoute.center.toArray(), head: arthRoute.head.toArray(), progress: ARTH_U } : null,
    breach: [-80, 0, 10],
    perches,
    trunks: trees.filter((t) => !t.fallen).map((t) => [t.x, t.z, 0.75 * t.s, 35 * t.s]).concat(juvs.map((j) => [j.x, j.z, 0.36 * j.s, 13 * j.s])),
    mounds: moundList.map((t) => [t.x, t.z, 2.6 * t.s]),
    extent: { xMin: -17, xMax: 17, zMin: -262, zMax: 222, naveHalfWidth: 5.4, crownBase: 28, top: 37 },
    flood: { fieldKx: KX, flow: [0.9848, 0, -0.1736], speedSideways: 3.5 },
  };

  let progress = 0.5, frontOverride = null;
  const camW = V3(), bounceAt = (u) => 0.34 * (opts.bounce ?? 1) * smoothstep(0.45, 0.62, u);
  const apply = () => {
    FU.uFront.value = frontOverride ?? floodFrontAt(progress);
    U.uBounce.value = bounceAt(progress);
    for (const c of critters) c.setProgress?.(progress);
  };
  apply();
  const hero = {
    object: root, radius: 62, height: 37, center: V3(0, 9, -40), anchors,
    ground: false, groundY: 0, water, shafts, griffinflies, uniforms: { ...U, ...FU }, floodFrontAt,
    setProgress(u) { progress = clamp(u, 0, 1); frontOverride = null; for (const c of critters) c.drive?.(); apply(); },
    setFront(z) { frontOverride = -z; apply(); },
    setWakes(list) { hero_wakes(list); },                         // [[x, z, r], ...] up to seven more things for the sheet to split round
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) { camera.getWorldPosition(camW); root.worldToLocal(camW); camW.y = Math.max(camW.y, 0.05); U.uCamL.value.copy(camW); }
      for (const c of critters) c.update?.(dt, time);
    },
    dispose() { FU.uObst.value?.dispose(); },
  };
  return hero;
}

// ---------------------------------------------------------------------------------------------------------
// ARTHROPLEURA: a flat armoured millipede 2.5 m long, 0.5 m wide, 0.25 m high. Model space: head at z = 0,
// body along -z, +y up, built straight; the vertex shader lays it along a route so the body flexes over what it
// climbs. 30 overlapping plates, each in three lobes (raised middle, two side flanges with a pale knobbed rim),
// 40 pairs of jointed legs whose tips show past the flanges, a small head with antennae and stalked eyes.
// Attributes: color, aLeg (x = wave phase, y = weight hip..foot, z = side, w = 0 body | 1 leg | 2 antenna), aAB (lateral, along).
export function arthropleuraGeometry(rng, o = {}) {
  const chest = new THREE.Color(o.body || '#6B3A22'), ochre = new THREE.Color(o.edge || '#C9A24A'), belly = new THREE.Color(o.belly || '#b99a5a');
  const pos = [], col = [], leg = [], ab = [], idx = [], c = new THREE.Color(), dark = chest.clone().multiplyScalar(0.55);
  const SEC = [[0, 1], [0.16, 0.97], [0.28, 0.86], [0.36, 0.5], [0.47, 0.54], [0.74, 0.44], [0.94, 0.3], [1.06, 0.14]];
  const HW = 0.295, HH = 0.15, NPL = 30, PL = 2.3 / NPL, WAVE = TAU / 0.52;
  const prof = (i) => 0.62 + 0.38 * smoothstep(-1, 5, i) - 0.42 * smoothstep(23, 30, i);       // width along the body
  const v = (x, y, z, cc, l = [0, 0, 0, 0], lat = 0) => { pos.push(x, y, z); col.push(cc.r, cc.g, cc.b); leg.push(l[0], l[1], l[2], l[3]); ab.push(lat, z); return pos.length / 3 - 1; };
  const ring = (z, hw, h, y0, tint, margin) => {
    const start = pos.length / 3;
    for (let j = -7; j <= 7; j++) {
      const s = SEC[Math.abs(j)], xf = s[0] * Math.sign(j);
      const aj = Math.abs(j);
      c.copy(chest).multiplyScalar(tint * (aj <= 2 ? 0.86 : 0.66)); if (aj === 3) c.lerp(dark, 0.85);                             // a raised middle, a dark furrow each side of it
      if (aj >= 6) c.lerp(ochre, (aj === 7 ? 0.95 : 0.6) * Math.min(1, tint * 1.6));                                                // the pale knobbed rim of each flange
      c.lerp(ochre, margin * (0.4 + 0.6 * aj / 7));
      v(xf * hw, y0 + s[1] * h, z, c, [0, 0, 0, 0], xf);
    }
    return start;
  };
  const strip = (a, b, n = 14) => { for (let j = 0; j < n; j++) idx.push(a + j, a + j + 1, b + j + 1, a + j, b + j + 1, b + j); };
  // head shield
  let z = 0; const h0 = ring(0.0, 0.035, 0.05, 0.05, 0.8, 0.2), h1 = ring(-0.045, 0.1, 0.1, 0.045, 0.85, 0.1), h2 = ring(-0.13, 0.135, 0.13, 0.045, 0.9, 0.3);
  strip(h0, h1); strip(h1, h2); z = -0.125;
  // thirty plates
  for (let i = 0; i < NPL; i++) {
    const w = prof(i) * HW, h = HH * (0.8 + 0.2 * prof(i)), tint = 0.86 + 0.28 * rng(), zf = z + 0.014, zb = z - PL;
    const a = ring(zf, w * 0.8, h * 0.84, 0.045, tint * 0.34, 0), m = ring((zf + zb) * 0.5 - 0.012, w * 1.06, h, 0.05, tint, 0.03), b = ring(zb, w * 0.97, h * 1.05, 0.05, tint * 1.12, 0.3);
    const u = ring(zb + 0.004, w * 0.86, h * 0.78, 0.045, tint * 0.22, 0);
    strip(a, m); strip(m, b); strip(b, u); z = zb;
  }
  // blunt tail plate
  const t0 = ring(z + 0.012, HW * 0.5, HH * 0.72, 0.045, 0.85, 0), t1 = ring(z - 0.07, HW * 0.46, HH * 0.6, 0.045, 0.95, 0.15), t2 = ring(z - 0.13, HW * 0.26, HH * 0.3, 0.045, 1.0, 0.5);
  strip(t0, t1); strip(t1, t2);
  const bodyEnd = z - 0.13;
  // pale belly
  for (let i = 0; i < 16; i++) {
    const za = -0.02 - (i / 16) * (0.1 - bodyEnd), zb2 = -0.02 - ((i + 1) / 16) * (0.1 - bodyEnd), wa = 0.17 * prof(i * 2 - 1), wb = 0.17 * prof(i * 2 + 1);
    const p0 = v(-wa, 0.05, za, belly), p1 = v(wa, 0.05, za, belly), p2 = v(wb, 0.05, zb2, belly), p3 = v(-wb, 0.05, zb2, belly);
    idx.push(p0, p2, p1, p0, p3, p2);
  }
  // jointed things: 3-sided tubes through a list of [x, y, z, radius, weight]
  const tube = (pts, ca, cb, l) => {
    const rows = [];
    pts.forEach((p, k) => {
      const q0 = pts[Math.max(0, k - 1)], q1 = pts[Math.min(pts.length - 1, k + 1)], t = V3(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      const a = V3(0, 0, 1).addScaledVector(t, -t.z).normalize(), b = V3().crossVectors(t, a), row = [];
      c.copy(ca).lerp(cb, k / (pts.length - 1));
      for (let j = 0; j < 3; j++) { const th = (j / 3) * TAU; row.push(v(p[0] + (a.x * Math.cos(th) + b.x * Math.sin(th)) * p[3], p[1] + (a.y * Math.cos(th) + b.y * Math.sin(th)) * p[3], p[2] + (a.z * Math.cos(th) + b.z * Math.sin(th)) * p[3], c, [l[0], p[4], l[1], l[2]])); }
      rows.push(row);
    });
    for (let k = 0; k < rows.length - 1; k++) for (let j = 0; j < 3; j++) { const j1 = (j + 1) % 3; idx.push(rows[k][j], rows[k][j1], rows[k + 1][j1], rows[k][j], rows[k + 1][j1], rows[k + 1][j]); }
  };
  const legA = chest.clone().multiplyScalar(0.4), legB = chest.clone().multiplyScalar(0.8).lerp(ochre, 0.3);
  for (let j = 0; j < 40; j++) for (const s of [-1, 1]) {
    const zl = -0.17 - j * (2.2 / 40), e = HW * prof(j * 0.75) * s, ph = -zl * WAVE + (s > 0 ? 0 : 0.5);
    tube([[0.3 * e, 0.07, zl, 0.018, 0], [0.74 * e, 0.092, zl, 0.016, 0.3], [1.0 * e, 0.058, zl - 0.006, 0.014, 0.8], [1.13 * e, 0.004, zl - 0.014, 0.008, 1]], legA, legB, [ph, s, 1]);
  }
  for (const s of [-1, 1]) {
    tube([[0.035 * s, 0.085, -0.01, 0.014, 0], [0.095 * s, 0.12, 0.09, 0.011, 0.5], [0.15 * s, 0.1, 0.2, 0.006, 1]], legB, ochre, [0, s, 2]);         // antennae
    tube([[0.07 * s, 0.11, -0.06, 0.012, 0], [0.115 * s, 0.16, -0.05, 0.011, 0]], legA, legA, [0, s, 0]);                                               // eye stalks
    const e = [0.122 * s, 0.17, -0.048], r = 0.024, black = new THREE.Color(0.012, 0.009, 0.006), glint = new THREE.Color(1.5, 1.4, 1.2);
    { const g0 = v(e[0] + 0.004, e[1] + r * 0.75, e[2] + 0.014, glint), g1 = v(e[0] + 0.014, e[1] + r * 0.45, e[2] + 0.02, glint), g2 = v(e[0] - 0.004, e[1] + r * 0.4, e[2] + 0.024, glint); idx.push(g0, g2, g1, g0, g1, g2); }
    const top = v(e[0], e[1] + r, e[2], black), bot = v(e[0], e[1] - r, e[2], black), q = [[r, 0], [0, r], [-r, 0], [0, -r]].map(([dx, dz]) => v(e[0] + dx, e[1], e[2] + dz, black));
    for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; idx.push(top, q[k1], q[k], bot, q[k], q[k1]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aLeg', new THREE.Float32BufferAttribute(leg, 4));
  g.setAttribute('aAB', new THREE.Float32BufferAttribute(ab, 2));
  g.setIndex(idx); g.computeVertexNormals();
  g.userData.length = -bodyEnd;
  return g;
}

// One Arthropleura walking a route. route: { points: [Vector3], normals: [Vector3] } evenly spaced (spacing m).
// Returns { mesh, setHead(s), length }: s = metres of route under the head; legs are phased by distance walked,
// so feet do not slide whatever drives s. Export so the world can put more of them on routes of its own.
const ARTH_NP = 72;
export function makeArthropleura(geometry, route, U, o = {}) {
  const P = [], N = [];
  for (let i = 0; i < ARTH_NP; i++) { const k = Math.min(i, route.points.length - 1); P.push(route.points[k].clone()); N.push(route.normals[k].clone()); }
  const uni = { uPath: { value: P }, uPathN: { value: N }, uHead: { value: 2.7 }, uSpacing: { value: route.spacing }, uWalk: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.42, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni, { uTime: U.uTime, uBounce: U.uBounce, uBounceCol: U.uBounceCol, uFill: U.uFill });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aLeg; attribute vec2 aAB; varying vec2 vAB; varying float vLegK;
        uniform vec3 uPath[${ARTH_NP}]; uniform vec3 uPathN[${ARTH_NP}]; uniform float uHead, uSpacing, uWalk, uTime;
        vec3 arthPath(float f, out vec3 nrm){ f = clamp(f, 0., ${(ARTH_NP - 1).toFixed(1)} - .001); int i = int(floor(f)); float t = f - float(i); int i1 = min(i + 1, ${ARTH_NP - 1});
          nrm = mix(uPathN[i], uPathN[i1], t); return mix(uPath[i], uPath[i1], t); }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float aS = uHead + position.z, aF = aS / max(uSpacing, 1e-3); vec3 nA, nB;
        vec3 pA = arthPath(aF - .5, nA), pB = arthPath(aF + .5, nB);
        vec3 aT = normalize(pB - pA + vec3(0., 0., 1e-5));
        vec3 aN = nA + nB; aN = aN - aT * dot(aN, aT); aN = aN / max(length(aN), 1e-4);
        vec3 aBi = cross(aN, aT);
        objectNormal = aBi * objectNormal.x + aN * objectNormal.y + aT * objectNormal.z;`)
      .replace('#include <begin_vertex>', `
        vec3 lp = vec3(position.xy, 0.); float ph = uWalk - aLeg.x;
        float isLeg = step(.5, aLeg.w) * (1. - step(1.5, aLeg.w)), isAnt = step(1.5, aLeg.w);
        lp.z += isLeg * aLeg.y * .05 * sin(ph); lp.y += isLeg * aLeg.y * .03 * max(cos(ph), 0.); lp.x += isLeg * aLeg.y * aLeg.z * .022 * cos(ph);
        lp.x += isAnt * aLeg.y * .03 * sin(uTime * 2.6 + aLeg.z * 1.7); lp.y += isAnt * aLeg.y * .02 * sin(uTime * 3.3 + aLeg.z);
        lp.y *= 1. + .035 * sin(aS * 3.1 + uTime * 1.3) * (1. - step(.5, aLeg.w));                 // plates breathe
        float flex = sin(aS * 2.2 - uWalk * .2) * .03;
        vec3 transformed = (pA + pB) * .5 + aBi * (lp.x + flex) + aN * lp.y + aT * lp.z;
        vAB = aAB; vLegK = aLeg.w;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vAB; varying float vLegK; uniform vec3 uBounceCol, uFill; uniform float uBounce;
        ${GLSL_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float aFade = 1. - smoothstep(7., 26., length(vViewPosition));
        vec2 tc = vAB * vec2(3.6, 52.); float tub = vn2(tc), tub2 = vn2(tc * 3.1);
        float bodyK = (1. - step(.5, vLegK)) * aFade;
        diffuseColor.rgb *= mix(1., .66 + .44 * tub + .16 * tub2, bodyK);
        float knob = smoothstep(.8, .92, abs(vAB.x)) * smoothstep(.2, .55, abs(fract(vAB.y * 39.1) - .5) * 2.);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.45 + vec3(.06, .04, .012), knob * bodyK * .7);
        diffuseColor.rgb *= 1. - .5 * bodyK * smoothstep(.3, .36, abs(vAB.x)) * (1. - smoothstep(.38, .47, abs(vAB.x)));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = .34 + .3 * tub * bodyK;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * uBounce * 1.1 + uFill * .5);`);
  };
  m.customProgramCacheKey = () => 'stm-arth';
  const mesh = new THREE.Mesh(geometry, m); mesh.frustumCulled = false;
  const stride = 0.16;
  return { mesh, length: geometry.userData.length || 2.55, routeLength: (route.points.length - 1) * route.spacing,
    setHead(s) { uni.uHead.value = s; uni.uWalk.value = (s / stride) * TAU; } };
}

// Route for the mound creature, laid out in the world so the picture does not depend on the seed: in from the water on the
// nave side, up onto a low mossy hummock joined to the mound (ARTH_HUMMOCK) so that at ARTH_U the whole animal lies across the
// camera's line on lit moss with water all round, then on round the foot of the trunk. The tree is turned (ARTH_SPOKE) so its
// nave-side roots run clear of the animal's back. Offsets are metres from the trunk (x toward the sun, z up the nave); heights come from
// the mound and the real root tubes, so the animal rides over what it climbs and no root lies across its back.
export const ARTH_U = 0.61;                                    // journey progress at which the head reaches ARTH_POSE
const ARTH_SPOKE = Math.atan2(-0.55, -0.83), ARTH_POSE = [-1.7, 1.25];
export const ARTH_HUMMOCK = [-3.05, 0.35, 0.8];              // x, z (metres from the trunk) and scale of the hummock on the nave side
const ARTH_CTRL = [[-9.5, -0.6], [-7.0, -0.3], [-5.4, 0.0], [-4.4, 0.2], [-3.3, 0.45], [-2.4, 0.8], [-1.7, 1.25], [-0.9, 1.95], [0.3, 2.2], [1.4, 1.6], [2.0, 0.4],
  [1.7, -1.0], [0.6, -1.9], [-0.8, -1.9], [-1.9, -0.9], [-2.0, 0.6], [-1.3, 1.7], [0, 2.1]];
async function moundRoute(sk, tree, step) {
  const cs = Math.cos(tree.rot), sn = Math.sin(tree.rot), segs = [];
  for (const tb of sk.tubes) if (tb.kind === 1) for (let i = 0; i < tb.P.length - 1; i++) segs.push([tb.P[i], tb.P[i + 1], tb.R[i], tb.R[i + 1]]);
  const h1 = (wx, wz) => {
    const lx = wx * cs - wz * sn, lz = wx * sn + wz * cs; let y = Math.max(moundHeight(Math.hypot(lx, lz)), ARTH_HUMMOCK[2] * moundHeight(Math.hypot(wx - ARTH_HUMMOCK[0], wz - ARTH_HUMMOCK[1]) / ARTH_HUMMOCK[2]), 0) + 0.03;
    for (const [a, b, ra, rb] of segs) {
      const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((lx - a.x) * ex + (lz - a.z) * ez) / Math.max(ex * ex + ez * ez, 1e-6), 0, 1);
      const d = Math.hypot(lx - a.x - ex * t, lz - a.z - ez * t), rad = lerp(ra, rb, t) * 1.25;
      if (d < rad) y = Math.max(y, lerp(a.y, b.y, t) + Math.sqrt(rad * rad - d * d) * 0.8 - 0.03);
    }
    return y;
  };
  const hAt = (x, z) => { const c = h1(x, z), m = Math.max(c, h1(x + 0.15, z), h1(x - 0.15, z), h1(x, z + 0.15), h1(x, z - 0.15)); return c * 0.5 + m * 0.5; };
  const curve = new THREE.CatmullRomCurve3(ARTH_CTRL.map(([x, z]) => V3(x, 0, z)), false, 'centripetal');
  const n = Math.round(curve.getLength() / 0.34), spacing = curve.getLength() / n, flat = curve.getSpacedPoints(n).slice(0, ARTH_NP);
  let iPose = 0; flat.forEach((p, i) => { if (Math.hypot(p.x - ARTH_POSE[0], p.z - ARTH_POSE[1]) < Math.hypot(flat[iPose].x - ARTH_POSE[0], flat[iPose].z - ARTH_POSE[1])) iPose = i; });
  // only the roots that can touch the route are tested (the same heights, a fraction of the work), and the build gets a frame
  // back between the passes
  { let mx = 0, mz = 0; for (const p of flat) { mx += (p.x * cs - p.z * sn) / flat.length; mz += (p.x * sn + p.z * cs) / flat.length; }
    let rr = 0; for (const p of flat) rr = Math.max(rr, Math.hypot(p.x * cs - p.z * sn - mx, p.x * sn + p.z * cs - mz));
    rr += 0.6;
    const keep = segs.filter(([a, b, ra, rb]) => Math.hypot((a.x + b.x) / 2 - mx, (a.z + b.z) / 2 - mz) < rr + Math.hypot(b.x - a.x, b.z - a.z) / 2 + Math.max(ra, rb) * 1.25);
    segs.length = 0; for (const sg of keep) segs.push(sg); }
  if (step) await step();
  const hs = []; for (let i = 0; i < flat.length; i++) { hs.push(hAt(flat[i].x, flat[i].z)); if (step && i % 16 === 15) await step(); }
  const points = flat.map((p, i) => V3(tree.x + p.x, (hs[Math.max(i - 1, 0)] + 2 * hs[i] + hs[Math.min(i + 1, flat.length - 1)]) / 4, tree.z + p.z)), e = 0.22;
  const normals = []; for (let i = 0; i < flat.length; i++) { const p = flat[i];
    normals.push(V3(-(hAt(p.x + e, p.z) - hAt(p.x - e, p.z)) / (2 * e), 1, -(hAt(p.x, p.z + e) - hAt(p.x, p.z - e)) / (2 * e)).normalize()); if (step && i % 8 === 7) await step(); }
  const iMid = Math.max(0, iPose - 5);
  return { points, normals, spacing, pose: iPose * spacing, length: (points.length - 1) * spacing, head: points[iPose].clone(), center: points[iMid].clone() };
}

// ---------------------------------------------------------------------------------------------------------
// GRIFFINFLY (Meganeura-kin): 0.7 m span, 0.4 m body. Model space: head +Z, back +Y, wings spread level across the XZ plane
// and never folded. Body: banded rod abdomen two thirds of the length, humped thorax, a head that is nearly all
// two domed eyes, six spiny legs held forward as a basket. Wings: four narrow sheets, veins drawn in the shader.
// Returns { body, wings } geometries. Body attributes: color. Wings: aWing (span 0..1, chord 0..1, pair 0 fore | 1 hind, side).
export function griffinflyGeometry() {
  const pos = [], col = [], idx = [], c = new THREE.Color();
  const black = new THREE.Color('#20230f'), olive = new THREE.Color('#b4b85a'), eyeC = new THREE.Color('#6b7a22'), amber = new THREE.Color('#8a5a1c');
  const v = (x, y, z, cc) => { pos.push(x, y, z); col.push(cc.r, cc.g, cc.b); return pos.length / 3 - 1; };
  // lofted rings along z: [z, y, rx, ry, colour]
  const loft = (rows, sides) => {
    const st = rows.map(([z, y, rx, ry, cc]) => { const s0 = pos.length / 3; for (let j = 0; j < sides; j++) { const th = (j / sides) * TAU; v(Math.sin(th) * rx, y + Math.cos(th) * ry, z, cc); } return s0; });
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; idx.push(st[i] + j, st[i] + j1, st[i + 1] + j, st[i] + j1, st[i + 1] + j1, st[i + 1] + j); }
  };
  // abdomen: ten banded segments, each waisted at its joint
  const ab = []; for (let i = 0; i <= 10; i++) {
    const z = -0.035 - i * 0.029, r = lerp(0.018, 0.011, i / 10) * (i === 10 ? 0.5 : 1), cc = i % 2 ? olive : black;
    ab.push([z + 0.003, 0.004 - i * 0.0008, r * 0.8, r * 0.8, black], [z - 0.012, 0.004 - i * 0.0008, r * 1.15, r * 1.1, cc], [z - 0.024, 0.004 - i * 0.0008, r, r, cc]);
  }
  loft(ab.slice(0, 31), 6);
  // thorax: humped, olive saddle on black
  loft([[0.058, 0.004, 0.014, 0.014, black], [0.045, 0.014, 0.029, 0.031, black], [0.02, 0.023, 0.037, 0.043, olive], [-0.01, 0.019, 0.034, 0.037, black], [-0.036, 0.006, 0.019, 0.019, olive]], 8);
  // head: a small face and two domed eyes that nearly meet on top
  loft([[0.086, 0.004, 0.006, 0.006, black], [0.074, 0.006, 0.016, 0.013, olive], [0.058, 0.006, 0.014, 0.013, black]], 6);
  for (const s of [-1, 1]) {
    const e = [0.018 * s, 0.015, 0.071], r = 0.0215, rows = [];
    for (let i = 0; i <= 4; i++) { const ph = (i / 4) * Math.PI, row = []; for (let j = 0; j < 6; j++) { const th = (j / 6) * TAU; c.copy(eyeC).multiplyScalar(i === 1 && j === (s > 0 ? 1 : 5) ? 9 : 0.6 + 0.6 * Math.cos(ph)); row.push(v(e[0] + Math.sin(ph) * Math.cos(th) * r, e[1] + Math.cos(ph) * r, e[2] + Math.sin(ph) * Math.sin(th) * r * 1.15, c)); } rows.push(row); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const j1 = (j + 1) % 6; idx.push(rows[i][j], rows[i][j1], rows[i + 1][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  }
  // six jointed legs reaching forward and down, spines as a ragged third edge
  const leg = (pts) => {
    const rows = pts.map((p) => [v(p[0], p[1] + p[3], p[2], black), v(p[0] - p[3], p[1] - p[3] * 0.6, p[2], black), v(p[0] + p[3], p[1] - p[3] * 0.6, p[2] + p[3], olive)]);
    for (let k = 0; k < rows.length - 1; k++) for (let j = 0; j < 3; j++) { const j1 = (j + 1) % 3; idx.push(rows[k][j], rows[k + 1][j], rows[k][j1], rows[k][j1], rows[k + 1][j], rows[k + 1][j1]); }
  };
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const z0 = 0.04 - k * 0.026, reach = 0.05 + k * 0.012;
    leg([[0.014 * s, -0.012, z0, 0.004], [0.05 * s, -0.004, z0 + 0.02 + reach * 0.3, 0.0035], [0.075 * s, -0.03, z0 + 0.03 + reach * 0.8, 0.0028], [0.085 * s, -0.045, z0 + 0.035 + reach, 0.0012]]);
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  body.setIndex(idx); body.computeVertexNormals();
  // wings: narrow, widest past mid-span, rounded tips; fore pair swept a little forward, hind pair a little back and broader at the base
  const wp = [], ww = [], wi = [], NS = 7;
  for (let pair = 0; pair < 2; pair++) for (const s of [-1, 1]) {
    const z0 = pair === 0 ? 0.03 : -0.012, sweep = pair === 0 ? 0.035 : -0.03, span = pair === 0 ? 0.345 : 0.325, base = wp.length / 3;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, x = (0.012 + span * t) * s, ch = (0.012 + 0.066 * Math.pow(Math.sin(Math.PI * Math.min(0.06 + t * 0.9, 1)), 0.55)) * (pair ? 1.12 : 1);
      const zl = z0 + sweep * t + ch * 0.36, zt = zl - ch * (1 - 0.25 * t * t);
      wp.push(x, 0.026, zl, x, 0.026, zt); ww.push(t, 0, pair, s, t, 1, pair, s);
      if (i < NS) { const a = base + i * 2; wi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const wings = new THREE.BufferGeometry();
  wings.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wings.setAttribute('aWing', new THREE.Float32BufferAttribute(ww, 4)); wings.setIndex(wi);
  return { body, wings, amber };
}

// Griffinflies as two InstancedMeshes (bodies, wings). count instances; every one starts hidden (scale 0) until
// placed. place(i, position, outward, roll) perches one on a surface (head up, wings flat against the view);
// setMatrix(i, m) and setFlap(i, 0..1) let the world fly the rest (flap 0 = wings held flat, quivering; 1 = beating).
export function makeGriffinflies(count, U, pal, FUlike) {
  const G = griffinflyGeometry(), fly = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) fly[i * 2] = i * 2.399;
  const flyAttr = new THREE.InstancedBufferAttribute(fly, 2);
  G.body.setAttribute('iFly', flyAttr); G.wings.setAttribute('iFly', flyAttr);
  const bm = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.32, metalness: 0, side: THREE.DoubleSide });
  bm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: U.uTime, uBounce: U.uBounce, uBounceCol: U.uBounceCol, uFill: U.uFill });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 iFly; uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float tail = clamp((-.03 - position.z) / .3, 0., 1.);                          // the abdomen pumps and dips
          transformed.y += tail * tail * (.012 * sin(uTime * 2.1 + iFly.x) - .006);
          transformed.xy *= 1. + .06 * sin(uTime * 5.5 + iFly.x + position.z * 30.) * tail; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBounceCol, uFill; uniform float uBounce;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * uBounce + uFill * .7);');
  };
  bm.customProgramCacheKey = () => 'stm-gbody';
  const wm = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uAmber: { value: new THREE.Color(pal[6]) }, uSunCol: FUlike.uSunCol, uFill: U.uFill, uSunDir: FUlike.uSunDir },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aWing; attribute vec2 iFly; uniform float uTime; varying vec4 vW; varying vec3 vVW;
      void main(){
        vec3 p = position; float pair = aWing.z;
        float shiver = smoothstep(.75, 1., sin(uTime * .7 + iFly.x)) * sin(uTime * 23. + pair * 2.) * .05;
        float ang = iFly.y * sin(uTime * 34. + iFly.x + pair * 1.1) * .7 + (1. - iFly.y) * (.04 * sin(uTime * 1.3 + iFly.x + pair) + shiver);
        float a = ang * aWing.w, cs = cos(a), sn = sin(a); vec2 rel = p.xy - vec2(.012 * aWing.w, .026);
        p.xy = vec2(.012 * aWing.w, .026) + vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);
        vec4 lp = vec4(p, 1.);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
        #endif
        vW = aWing; vec4 wp = modelMatrix * lp; vVW = wp.xyz - cameraPosition;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uAmber, uSunCol, uFill, uSunDir; varying vec4 vW; varying vec3 vVW;
      void main(){
        float t = vW.x, c = vW.y;
        float det = 1. - smoothstep(.3, .9, fwidth(t) * 34.);
        float lon = min(min(abs(c - .2 - .05 * t), abs(c - .42 - .08 * t)), abs(c - .66 - .05 * t));
        float vein = 1. - smoothstep(.012, .03, lon);
        vein = max(vein, 1. - smoothstep(.03, .075, min(c, 1. - c) + .02));                          // stout leading and trailing edges
        float cross = 1. - smoothstep(.07, .14, abs(fract(t * 30. + floor(c * 4.) * .37) - .5));
        float net = (1. - smoothstep(.06, .13, abs(fract(c * 8. + sin(t * 21.) * .12) - .5))) * step(.45, c);
        vein = mix(.22, max(vein, max(cross * .75, net * .55)), det);
        float baseT = 1. - smoothstep(0., .34, t);
        vec3 V = vVW / max(length(vVW), 1e-4); float back = max(dot(V, uSunDir), 0.); back *= back;
        vec3 col = uAmber * (vein + baseT * .7 + .12) * (uSunCol * (.55 + 2.4 * back) + uFill * 1.2) + vec3(.9, 1., .85) * .05;
        gl_FragColor = vec4(col, clamp(vein * .82 + .07 + baseT * .4, 0., .94));
        #include <fog_fragment>
      }`,
  });
  const body = new THREE.InstancedMesh(G.body, bm, count), wings = new THREE.InstancedMesh(G.wings, wm, count);
  body.frustumCulled = wings.frustumCulled = false; wings.renderOrder = 3;
  const Z = new THREE.Matrix4().makeScale(0, 0, 0), M = new THREE.Matrix4(), X = V3(), Y = V3(), Zv = V3();
  for (let i = 0; i < count; i++) { body.setMatrixAt(i, Z); wings.setMatrixAt(i, Z); }
  const setMatrix = (i, m) => { body.setMatrixAt(i, m); wings.setMatrixAt(i, m); body.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true; };
  return {
    body, wings, count, setMatrix,
    setFlap(i, f) { fly[i * 2 + 1] = f; flyAttr.needsUpdate = true; },
    place(i, position, outward, roll = 0, scale = 1) {
      Y.set(outward[0], outward[1], outward[2]).normalize(); Zv.set(0, 1, 0).addScaledVector(Y, -Y.y).normalize().applyAxisAngle(Y, roll);
      X.crossVectors(Y, Zv); M.makeBasis(X, Y, Zv).scale(V3(scale, scale, scale)).setPosition(position[0] + Y.x * 0.05, position[1] + Y.y * 0.05, position[2] + Y.z * 0.05);
      setMatrix(i, M);
    },
  };
}
