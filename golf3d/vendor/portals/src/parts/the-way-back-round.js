// THE SKY-TREE: hero set piece of "the-way-back-round" (The Sky Is the Far Side).
//
// WHAT IT IS
//   One island SET (a 120 m blossoming tree with buttress roots and three root arches, its rock spine,
//   a white pavilion, a jetty and a skiff with a gold lugsail, falling petals, twelve cranes) built once
//   as geometry, and drawn by several GROUPS that share those buffers and differ only in material clone:
//     A     the island we leave, at the origin;
//     FAR   the same set mirrored east for west (scale.x < 0), S times life size, washed toward pearl:
//           the Sky-Tree. It shrinks and colours with progress u until it is island B at z = +lap;
//     reflections of both (scale.y < 0) for the world's transparent water plane to lie over.
//   Nothing is a backdrop: boughs sway, blossom trembles, petals fall, the sail luffs and the cranes beat
//   in every group from the same uniforms, so the giant keeps step with the near island for free.
//
// AXES   origin = centre of the trunk at the waterline (y 0 = water). +Y up. Front = +Z = NORTH = the
//   direction of flight. EAST IS -X (so that east is to starboard when flying north).
//   Brief coordinates (east e, north n) are local (-e, y, n).
//
// OPTS   palette  array of 7 hex strings (brief order: pearl, pink, white, slate, charcoal, gold, mint)
//        detail   0.6..1 thins blossom cards, petals and reflection cards (never trunk, cranes, built)
//        lap      1600  length of the universe (m): island B stands at z = +lap
//        bigS     24    size of the far image at u <= 0.07
//        wash     0.7   how far the far image is washed toward uWashCol at full size
//        birds    'crane' | 'egret' (the same twelve, painted white)
//        petalB, leaf, leafAmount   season: blossom throat colour, leaf colour and share among the sprays
//        water    true  a plain slate water sheet so reflections read in the viewer; the world passes
//                       false and lays its own water plane at y 0
//
// PROGRESS  hero.setProgress(u) (or hero.uniforms.uProgress.value = u) every frame, then update().
//   If it is never called the piece shows itself at u = 0.12 (the giant filling the sky to the north).
//   S = mix(bigS, 1, smoothstep(0.07, 0.68, u)) is the image's real size; a = mix(74, 535,
//   smoothstep(0.1, 0.68, u)^1.5) is how far off it LOOKS in set metres (held small until u 0.22 so the
//   crown crosses the whole upper frame). FAR.scale = (-S, S, S), FAR.position.z = cameraZ + S * a,
//   clamped so that it never passes lap. Author the path so cameraZ = lap - 535 at u 0.68.
//   The wash is a function of u alone and only ever drains (washMax at u <= 0.1, a tenth at u 0.6, none
//   by 0.9); the far image never takes engine fog. Its lowest set metres stand in a mist band (uMist).
//   THE PROOFS (pavilion, jetty, skiff with the gold sail) stand on the south-east shore, so they are seen
//   to starboard of the entry line, on the port flank of the mirrored giant, and to port of the ring.
//
// ANCHORS (local space of island A; mirror x and add lap to z for island B, see anchors.toB)
//   see the anchors object at the bottom of buildHero; each has a comment there.
//
// LIGHT  none needed: every material is a ShaderMaterial lit by its own shadowless hemisphere
//   (pearl above, slate-celadon bounce below) times an analytic canopy-shade term, so scene lights
//   are ignored. Scene fog is honoured (fog chunks); FAR swaps fog for its pearl wash while S > 1.
//
// ANCHORS  entry {position, direction}; portalSeat {position, facing, radius, local, archSpan, archHeight}
//   (position is in WORLD terms of island B: the 14 m ring stands upright under the tallest root arch,
//   facing +Z; `local` is the same seat on island A); flyOut (A-local points: it starts 34 m SOUTH of that
//   arch, flies through it and out under the crown); flyIn (a straight last 300 m, already on island B; the
//   world swings wider to port); setCraneCourse(keys, points) lets the world lay the cranes' course; toB(v) converts any
//   A-local point; pavilion, sail, skiff, jetty, cranesStand, cranesLand, rootArches, crownCenter,
//   crownRadius, hemY, trunkTop, island tips, viewpoints. Also returned: heightAt(x, z) (rock height,
//   below 0 = water), groups {A, FAR, FARr, Ar}, uniforms (uSky, uBounce, uWashCol ...), state {S, a, wash, farZ}.
//
// COST   142k triangles in all four groups together (A 49k, FAR 49k, reflections 22k each; A and its
//   reflection hide from u 0.3), 20 draw calls (21 with the viewer water), one 1024 px atlas, no lights,
//   about 380 ms of build in steps under 50 ms. update() moves two groups and writes 12 cranes.
import * as THREE from 'three';
import { makeNoise, makeRng, smoothstep, lerp, clamp } from '../kit/core.js';

const PAL = ['#EAF2F5', '#F6B8C8', '#FFFFFF', '#5C7F8A', '#2C3E46', '#E9C46A', '#A7D8D0'];
const TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- geometry accumulator -------------------------------------------------------------------------
// aBark: x = angle round the tube 0..1, y = metres along, z = plates round, w = kind (0 trunk, 1 bough, 2 root)
function newAcc() { return { pos: [], nor: [], bark: [], idx: [], idxTwig: [], n: 0 }; }

// Sweep a tube along a smooth curve through pts. radius(t) and profile(theta, t) shape each ring.
function sweep(G, pts, rings, segs, radius, kind, profile) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const base = G.n, up = V3(0, 1, 0), tan = V3(), nrm = V3(), bin = V3(), p = V3(), q = V3();
  let ref = V3(1, 0, 0), along = 0; const prev = V3();
  const plates = Math.max(5, Math.round(TAU * radius(0.3) / 0.42));
  for (let i = 0; i <= rings; i++) {
    const t = i / rings; curve.getPoint(t, p); curve.getTangent(t, tan);
    if (i === 0 && Math.abs(tan.dot(ref)) > 0.9) ref.set(0, 0, 1);
    // parallel transport: keep ref perpendicular to the tangent without twisting
    // (a root's first third keeps one vertex of every ring straight up, so its fin has a clean ridge)
    if (kind === 2 && t < 0.34 && Math.abs(tan.y) < 0.85) nrm.copy(up).addScaledVector(tan, -tan.y);
    else nrm.copy(ref).addScaledVector(tan, -ref.dot(tan));
    if (nrm.lengthSq() < 1e-6) nrm.copy(up).addScaledVector(tan, -up.dot(tan));
    nrm.normalize(); bin.crossVectors(tan, nrm).normalize(); ref.copy(nrm);
    if (i > 0) along += p.distanceTo(prev); prev.copy(p);
    const r = radius(t);
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * TAU, c = Math.cos(th), s = Math.sin(th);
      q.copy(nrm).multiplyScalar(c).addScaledVector(bin, s);
      const k = profile ? profile(th, t, q) : 1;
      G.pos.push(p.x + q.x * r * k, p.y + q.y * r * k, p.z + q.z * r * k);
      G.nor.push(q.x, q.y, q.z);
      G.bark.push(j / segs, along, plates, kind);
    }
  }
  const w = segs + 1;
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = base + i * w + j, b = a + w;
    G.idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  G.n += (rings + 1) * w;
  return curve;
}

function accToGeometry(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('aBark', new THREE.Float32BufferAttribute(G.bark, 4));
  g.setIndex(G.idx.concat(G.idxTwig));
  // the reflection draws the same vertices without the twigs
  const r = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'aBark']) r.setAttribute(k, g.getAttribute(k));
  r.setIndex(G.idx);
  return [g, r];
}

// brief coordinates (east, north) -> local
const EN = (e, y, n) => V3(-e, y, n);

// THE PROOFS stand together on the south-east shore, where they can be seen three times: to starboard of
// the entry line, on the port flank of the mirrored giant (which we see from the south), and to port of
// the ring at arrival. Set coordinates (east is -x).
const PAV = { x: -46, z: 15 }, JETTY_Z = -8;
// ---- the island: a low spine of rock, 60 m south to 200 m north of the trunk, highest at the root mound ----
function makeIslandHeight(noise) {
  return (x, z) => {
    const nz = z > 0 ? z / 200 : z / 60;
    // east shore (x < 0) is bitten by a small cove where the jetty stands, south-east of the trunk
    const cove = x < 0 ? 4 * Math.exp(-((z - JETTY_Z) * (z - JETTY_Z)) / 160) : 0;
    const hw = 40 - cove + 5 * noise.n2(z * 0.021, 3.7);
    // ...and swells into a round promontory just north of it, where the pavilion stands over the water
    const prom = 0.62 * Math.exp(-((x - PAV.x) * (x - PAV.x) + (z - PAV.z) * (z - PAV.z)) / 120);
    const e = 1 - Math.sqrt((x * x) / (hw * hw) + nz * nz) + 0.1 * noise.n2(x * 0.045 + 9, z * 0.045) + prom;
    const mound = Math.exp(-(x * x + z * z) / 900);
    if (e <= 0) return -2.6 * smoothstep(0, -0.22, e);
    const ridge = 1 - Math.abs(noise.n2(x * 0.06, z * 0.035 + 20));
    return (2.4 + 5.2 * mound + 1.4 * ridge * ridge) * smoothstep(0, 0.28, e) + 0.5 * noise.n2(x * 0.19, z * 0.19 + 50) * smoothstep(0, 0.1, e);
  };
}

// ---- the tree's skeleton: trunk, two tiers of great boughs, branches, twigs, buttress roots ----------
async function buildSkeleton(ctx, rng, hAt) {
  const G = newAcc(), lobes = [], boughShade = [];
  const lean = rng.range(-1, 1) * 2.5, leanA = rng() * TAU;
  const axis = (y) => { const k = y / 64; return V3(Math.cos(leanA) * lean * k * k + Math.sin(k * 3.1 + leanA) * 0.9, y, Math.sin(leanA) * lean * k * k + Math.cos(k * 2.3) * 0.9 - 0.9); };
  // roots: 9 directions; root 0 is the portal arch to the south-east (brief: 26 m east, 36 m south)
  const NR = 9, rootAng = [];
  const a0 = Math.atan2(-36, -26);
  for (let i = 0; i < NR; i++) rootAng.push(a0 + (i / NR) * TAU + (i ? rng.range(-0.16, 0.16) : 0));
  // trunk: 12 m through, flaring to 30 m across at the mound, fluted where the roots leave it
  const trunkPts = []; for (let i = 0; i <= 8; i++) trunkPts.push(axis(1 + i * 7.9));
  const flute = (th, t) => {
    let ridge = 0;
    for (let k = 0; k < NR; k++) { const c = Math.cos(-th - rootAng[k]); if (c > 0) ridge = Math.max(ridge, c * c * c * c); }
    const low = Math.pow(1 - t, 4);
    return 1 + low * (0.42 * ridge - 0.04) + 0.05 * Math.sin(th * 5 + t * 9) * (1 - t);
  };
  sweep(G, trunkPts, 32, 40, (t) => lerp(7.6, 2.6, Math.pow(t, 1.4)) + 2.2 * Math.pow(1 - t, 4), 0, flute);
  await ctx.yield();

  const twig = (from, dir, len, r0, depth) => {
    // one branch: rises, then droops at the tip; returns its curve
    const side = V3(-dir.z, 0, dir.x).normalize(), w = rng.range(-1, 1) * len * 0.12;
    const up = depth === 1 ? rng.range(0.1, 0.34) : rng.range(0.0, 0.3);
    const pts = [from.clone()];
    for (let i = 1; i <= 3; i++) {
      const s = i / 3;
      pts.push(from.clone().addScaledVector(dir, len * s).addScaledVector(side, w * Math.sin(s * 3.1))
        .add(V3(0, len * (up * Math.sin(s * 2.2) - (depth === 2 ? 0.16 : 0.08) * s * s), 0)));
    }
    const keep = G.idx; G.idx = G.idxTwig;
    const curve = sweep(G, pts, depth === 1 ? 7 : 4, depth === 1 ? 6 : 4, (t) => r0 * (1 - 0.85 * t) + 0.07, 1);
    G.idx = keep;
    return curve;
  };
  const tierLow = 5 + Math.floor(rng() * 2), tierHigh = 4, NB = tierLow + tierHigh, spin = rng() * TAU;
  for (let b = 0; b < NB; b++) {
    const high = b >= tierLow;
    const ang = spin + (high ? (b - tierLow) / tierHigh + 0.13 : b / tierLow) * TAU + rng.range(-0.22, 0.22);
    const hb = high ? rng.range(49, 60) : rng.range(33, 43);
    const leader = high && b === NB - 1;
    const L = leader ? rng.range(12, 18) : high ? rng.range(32, 46) : rng.range(52, 66);
    const rise = leader ? rng.range(44, 50) : high ? rng.range(30, 42) : rng.range(12, 22);
    const dir = V3(Math.cos(ang), 0, Math.sin(ang)), side = V3(-dir.z, 0, dir.x), bend = rng.range(-1, 1) * L * 0.16;
    const o = axis(hb), pts = [o];
    for (let i = 1; i <= 5; i++) {
      const s = i / 5, droop = high ? 0.04 : 0.34;
      pts.push(o.clone().addScaledVector(dir, L * (s * 0.92 + 0.08)).addScaledVector(side, bend * Math.sin(s * 2.6))
        .add(V3(0, rise * (Math.sin(s * 1.75) / 0.984) - droop * L * s * s * s, 0)));
    }
    const r0 = high ? 1.7 : 2.4;
    const curve = sweep(G, pts, 14, 10, (t) => r0 * Math.pow(1 - t, 0.75) + 0.22 + 0.9 * Math.pow(1 - t, 8), 1);
    const tip = curve.getPoint(1); lobes.push({ c: tip, r: rng.range(7.5, 10) });
    for (const s of [0.45, 0.8]) { const p = curve.getPoint(s); boughShade.push(new THREE.Vector4(p.x, p.y, p.z, high ? 20 : 26)); }
    // secondaries, alternating sides, and their twigs
    const nSec = leader ? 3 : high ? 4 : 6;
    for (let k = 0; k < nSec; k++) {
      const s = lerp(0.3, 0.94, (k + rng.range(0.2, 0.8)) / nSec), p = curve.getPoint(s), tg = curve.getTangent(s);
      const sgn = k % 2 ? 1 : -1, turn = sgn * rng.range(0.7, 1.25), c = Math.cos(turn), sn = Math.sin(turn);
      const d = V3(tg.x * c - tg.z * sn, 0, tg.x * sn + tg.z * c).normalize();
      const len = (high ? rng.range(13, 22) : rng.range(16, 28)) * (1.1 - 0.45 * s);
      const sc = twig(p, d, len, r0 * Math.pow(1 - s, 0.75) * 0.55 + 0.16, 1);
      lobes.push({ c: sc.getPoint(1), r: rng.range(6.5, 9) });
      lobes.push({ c: sc.getPoint(0.55).add(V3(0, 2.5, 0)), r: rng.range(5, 7) });
      const nT = 2 + Math.floor(rng() * 2);
      for (let m = 0; m < nT; m++) {
        const s2 = rng.range(0.35, 0.9), p2 = sc.getPoint(s2), t2 = sc.getTangent(s2);
        const tu = (m % 2 ? 1 : -1) * rng.range(0.6, 1.3), c2 = Math.cos(tu), s3 = Math.sin(tu);
        const d2 = V3(t2.x * c2 - t2.z * s3, 0, t2.x * s3 + t2.z * c2).normalize();
        const tc = twig(p2, d2, rng.range(6, 12), 0.2, 2);
        lobes.push({ c: tc.getPoint(1), r: rng.range(4.5, 7) });
      }
    }
    await ctx.yield();
  }
  return { G, lobes, boughShade, rootAng, axis };
}

// ---- buttress roots: 2 m thick, wandering 25-40 m over the rock into the water; three arch clear ----
const ARCH = { x: -26, z: -36, half: 9.6, top: 16.6, y0: 1.4 };   // the portal arch (brief: 18 m span, 16 m high)
async function buildRoots(ctx, rng, G, hAt, rootAng) {
  const arches = [], frng = makeRng(Math.floor(Math.abs(rootAng[1] * 7919 + rootAng[3] * 104729) * 1000) >>> 0);
  // a root rides the rock half sunk; its bed is the ground smoothed over a few metres so it never kinks
  const ground = (x, z, r) => Math.max((hAt(x, z) * 2 + hAt(x + 2.5, z) + hAt(x - 2.5, z) + hAt(x, z + 2.5) + hAt(x, z - 2.5)) / 6, -0.5) + r * 0.45;
  for (let k = 0; k < rootAng.length; k++) {
    const ang = rootAng[k], dir = V3(Math.cos(ang), 0, Math.sin(ang)), perp = V3(-dir.z, 0, dir.x);
    const L = rng.range(26, 40), amp = rng.range(2, 5) * rng.sign(), ph = rng() * TAU, r0 = rng.range(1.0, 1.3);
    // a buttress: the root leaves the trunk high as the ridge of a tall narrow fin and comes down to the rock
    const g10 = ground(dir.x * 11, dir.z * 11, r0) + 1.9, g0 = hAt(dir.x * 6, dir.z * 6);
    const pts = [V3(dir.x * 3.5, g0 + 9.5, dir.z * 3.5), V3(dir.x * 7.4, lerp(g0 + 9.5, g10, 0.55), dir.z * 7.4), V3(dir.x * 11, g10, dir.z * 11)];
    const amp2 = amp * (0.1 + 0.9 * rng.range(0.25, 0.5)), ph2 = rng() * TAU;
    const walk = (d0, d1, n, tail) => {
      for (let i = 1; i <= n; i++) {
        const d = lerp(d0, d1, i / n), w = (amp * Math.sin(d * 0.13 + ph) + amp2 * Math.sin(d * 0.3 + ph2)) * smoothstep(9, 17, d);
        const x = dir.x * d + perp.x * w, z = dir.z * d + perp.z * w;
        // the last two points go under: into the water if the root reaches it, into the rock if it does not
        const h = hAt(x, z);   // the tip goes under: into the water if the root reaches it, else it sinks into the moss
        pts.push(V3(x, tail && i === n ? (h > 0 ? h - 1.5 : h - 3.2) : tail && i === n - 1 ? (h > 0 ? ground(x, z, r0) - 0.55 : Math.min(h, 0.4) - 0.5) : ground(x, z, r0), z));
      }
    };
    let rad = (t) => 0.86 * r0 * (1 - 0.8 * t) + 0.4 * Math.pow(1 - t, 6) + 0.1, rings = 40;
    if (k === 0) {
      // the portal arch: crawl to the near foot, leap 16 m over the shallows, plunge in
      pts.push(V3(-10, ground(-10, -20, r0), -20));
      const f1x = ARCH.x + ARCH.half, f2x = ARCH.x - ARCH.half;
      pts.push(V3(f1x + 1.5, ground(f1x + 1.5, -31, r0) + 0.4, -31));
      for (const deg of [8, 32, 60, 90, 120, 148, 172]) {
        const th = deg * Math.PI / 180;
        pts.push(V3(ARCH.x + ARCH.half * Math.cos(th), ARCH.y0 + ARCH.top * Math.pow(Math.sin(th), 0.85), ARCH.z + 0.8 * Math.sin(th * 2)));
      }
      pts.push(V3(f2x - 2.5, -0.6, ARCH.z - 1.5), V3(f2x - 8, -1.8, ARCH.z - 4));
      rad = (t) => 1.12 * (1 - 0.3 * t) + 0.5 * Math.pow(1 - t, 8) - 0.5 * Math.pow(t, 6); rings = 60;
      arches.push({ c: V3(ARCH.x, 9, ARCH.z), span: ARCH.half * 2, height: ARCH.y0 + ARCH.top });
    } else if (k === 2 || k === 4) {
      const d1 = rng.range(13, 16), sp = rng.range(10, 13), H = rng.range(7.5, 10.5);
      walk(11, d1 + 2, 2, false);
      const b = pts[pts.length - 1];
      for (const s of [0.18, 0.5, 0.82]) {
        const d = d1 + sp * s; pts.push(V3(dir.x * d + (b.x - dir.x * d1), b.y + H * Math.pow(Math.sin(Math.PI * s), 0.8), dir.z * d + (b.z - dir.z * d1)));
      }
      const e = d1 + sp, ex = dir.x * e + (b.x - dir.x * d1), ez = dir.z * e + (b.z - dir.z * d1);
      pts.push(V3(ex, ground(ex, ez, r0) - 0.3, ez), V3(ex + dir.x * 7, -1.6, ez + dir.z * 7));
      arches.push({ c: V3((b.x + ex) / 2, b.y + H * 0.5, (b.z + ez) / 2), span: sp, height: H }); rings = 44;
    } else walk(11, L, 11, true);
    // roots are a little taller than wide where they stand as buttresses near the trunk
    // (and their girth swells and narrows a little along the way, like something grown)
    // (a tall narrow fin where they leave the trunk, rounder as they go; their girth swells once or twice
    // along the way, like something grown, never in beads)
    const fin = (th, t, q) => { const f = Math.pow(1 - t, 5); return (1 + 1.55 * f * q.y * q.y - 0.22 * f * (1 - q.y * q.y)) * (1 + 0.07 * Math.sin(t * 8 + k * 2.1) + 0.03 * Math.sin(t * 15 + k)); };
    const main = sweep(G, pts, rings, 12, rad, 2, fin);
    // a lesser root forks from each plain one and wanders off on its own
    if (k !== 0 && k !== 2 && k !== 4) {
      const s0 = frng.range(0.3, 0.5), from = main.getPoint(s0), tg = main.getTangent(s0), turn = frng.sign() * frng.range(0.45, 0.8), ct = Math.cos(turn), st = Math.sin(turn);
      const fd = V3(tg.x * ct - tg.z * st, 0, tg.x * st + tg.z * ct).normalize(), fp = V3(-fd.z, 0, fd.x), FL = frng.range(10, 17), fa = frng.range(1, 2.4) * frng.sign(), fph = frng() * TAU, fr = rad(s0) * 0.62;
      const fpts = [from.clone().add(V3(0, -0.1, 0))];
      for (let i = 1; i <= 7; i++) {
        const d = FL * i / 7, w = fa * Math.sin(d * 0.42 + fph) * Math.min(d / 4, 1), x = from.x + fd.x * d + fp.x * w, z = from.z + fd.z * d + fp.z * w, h = hAt(x, z);
        fpts.push(V3(x, i === 7 ? (h > 0 ? h - 1.2 : h - 2.5) : i === 6 ? (h > 0 ? ground(x, z, fr) - 0.4 : Math.min(h, 0.3) - 0.4) : ground(x, z, fr * 0.8), z));
      }
      sweep(G, fpts, 22, 8, (t) => fr * (1 - 0.8 * t) + 0.07, 2, (th, t) => 1 + 0.06 * Math.sin(t * 7 + k));
    }
    if (k % 3 === 2) await ctx.yield();
  }
  return arches;
}

// ---- the rock: one displaced sheet, denser than it needs to be far off, cheap enough to draw 4 times ----
function buildRock(hAt) {
  const NX = 48, NZ = 124, x0 = -55, x1 = 55, z0 = -74, z1 = 214;
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const x = lerp(x0, x1, i / NX), z = lerp(z0, z1, j / NZ), o = (j * (NX + 1) + i) * 3;
    pos[o] = x; pos[o + 1] = hAt(x, z); pos[o + 2] = z;
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + NX + 1;
    // skip cells that are wholly under water and flat: nothing to see there
    if (pos[a * 3 + 1] < -2.5 && pos[(a + 1) * 3 + 1] < -2.5 && pos[b * 3 + 1] < -2.5 && pos[(b + 1) * 3 + 1] < -2.5) continue;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---- shaders -----------------------------------------------------------------------------------------
const NSH = 12;
const COMMON = /* glsl */`
#define NSH ${NSH}
uniform float uTime, uWash, uFogAmt, uProgress, uMist;
uniform vec3 uSky, uBounce, uWashCol, uPink, uWhite, uSlate, uChar, uGold, uMint, uPearl;
uniform vec4 uShade[NSH];
// boughs sway 2 degrees on a 9 s period; a function of place only, so wood and blossom move as one
vec3 swayOf(vec3 p){
  float w = max(length(p.xz) - 9., 0.) * 0.035 * smoothstep(22., 40., p.y);
  float ph = uTime * 0.698 + p.x * 0.045 + p.z * 0.037;
  return vec3(sin(ph * 0.83 + 1.3) * 0.35, sin(ph), cos(ph * 0.71) * 0.35) * w;
}
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
// shadowless light: form comes from occlusion. Soft ellipsoids at the crown and each great bough.
float canopy(vec3 p){
  float o = 0.;
  for (int i = 0; i < NSH; i++) { vec4 s = uShade[i]; vec2 d = (p.xz - s.xz) / max(s.w, 1.); o += smoothstep(-2., 14., s.y - p.y) * exp(-dot(d, d) * 1.5); }
  return mix(1., 0.35, clamp(o * 0.85, 0., 1.));
}
// the far image stands in a band of mist: its lowest few metres (set metres, so a mountain's foot) dissolve
float washAt(float y){ return max(uWash, uMist * exp(-max(y, 0.) * 0.3)); }
vec3 hemi(vec3 n){ return mix(uBounce, uSky, clamp(n.y * 0.5 + 0.5, 0., 1.)); }
// the proofs (cranes, the gold sail) take only a share k of the far image's wash, so they stay findable
vec3 lessWash(vec3 c, float k){ return (mix(c, uWashCol, uWash * k) - uWashCol * uWash) / max(1. - uWash, 0.25); }
`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';
// the far image trades engine fog for its pearl wash while it is larger than life (uFogAmt 0 -> 1)
const FINISH = /* glsl */`
  col = mix(col, uWashCol, uWash);
  gl_FragColor = vec4(col, 1.);
  vec3 pre = gl_FragColor.rgb;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(pre, gl_FragColor.rgb, uFogAmt);
`;
// for shaders that know their set-space position vP: the same, with the mist band at the foot
const FINISH_Y = FINISH.replace('uWash)', 'washAt(vP.y))');

const BARK_V = COMMON + FOG_V + /* glsl */`
attribute vec4 aBark; varying vec3 vP, vN; varying vec4 vBark;
void main(){
  vP = position; vN = normal; vBark = aBark;
  vec4 mvPosition = modelViewMatrix * vec4(position + swayOf(position), 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BARK_F = COMMON + FOG_F + /* glsl */`
uniform vec3 uPetalA;
varying vec3 vP, vN; varying vec4 vBark;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  // deep vertical plates 0.4 m wide, staggered, with lichen in the furrows
  float pl = vBark.x * vBark.z, id = floor(pl), u = fract(pl);
  float isRoot = step(1.5, vBark.w);
  float v = vBark.y / 2.8 + hash21(vec2(id, 7.)) * 5., fv = fract(v), tone = mix(hash21(vec2(id, floor(v))), vnoise(vec2(id * 3.1, v * 0.35)), isRoot);
  float plate = smoothstep(0.5, 0.3, abs(u - 0.5)) * mix(smoothstep(0., 0.07, fv) * smoothstep(1., 0.93, fv), 1., isRoot);   // no ring seams on roots
  float crack = smoothstep(0.42, 0.5, abs(u - 0.5)) * mix(1., 0.4, isRoot);
  float detail = clamp(1.5 - fwidth(pl) * 2.2, 0., 1.) * clamp(1. - uWash * 1.6, 0., 1.);
  plate = mix(0.62, plate, detail); crack *= detail;
  float grain = vnoise(vec2(pl * 3., vBark.y * 0.9));
  vec3 bark = mix(uChar * 2.1, vec3(0.2, 0.185, 0.165), tone * 0.5 + grain * 0.4) * (0.7 + 0.6 * grain);
  float lich = smoothstep(0.38, 0.62, vnoise(vec2(pl * 0.45, vBark.y * 0.22) + 3.)) * (1. - plate * 0.8);
  vec3 col = mix(uChar * 0.6, bark, plate * (0.75 + 0.25 * smoothstep(0.5, 0.2, abs(u - 0.5))));
  col = mix(col, uMint * mix(0.4, 0.75, grain), lich * 0.8);
  col *= 1. - 0.7 * crack;
  // moss collars on every bough top and root back; a moss skirt round the foot of the trunk
  float mossy = vBark.w > 0.5 ? smoothstep(mix(0.35, 0.05, isRoot), 0.95, n.y + (grain - 0.5) * 0.8 + (vnoise(vP.xz * 0.6) - 0.5) * mix(0.7, 1.3, isRoot)) : smoothstep(15., 5., vP.y) * smoothstep(0.4, 0.75, vnoise(vP.xz * 0.35 + vP.y * 0.2));
  vec3 moss = mix(uMint * 0.42, vec3(0.19, 0.3, 0.12), mix(0.45, 0.7, isRoot) + mix(0.4, 0.3, isRoot) * vnoise(vP.xz * 1.7)) * (0.7 + 0.6 * grain);
  col = mix(col, moss, mossy * 0.92);
  // root backs and bough tops seen at a glance: moss in clumps, lichen, and the petals that have settled there
  // roots are sinew: long ridges that wander round them, lit on their backs, dark between
  float sinew = sin(vBark.x * 6.283 * 3. + 5. * vnoise(vec2(vBark.y * 0.16, vBark.x * 3.)) + vBark.y * 0.21) * (0.4 + 0.6 * vnoise(vec2(vBark.y * 0.3, 5.)));
  col *= mix(1., 0.93 + 0.12 * smoothstep(-0.5, 0.6, sinew), isRoot * clamp(1. - uWash * 1.5, 0., 1.));
  col = mix(col, mix(uMint * 0.5, vec3(0.2, 0.27, 0.16), 0.6) * (0.6 + 0.5 * grain), isRoot * smoothstep(0.3, 0.9, sinew + (grain - 0.5)) * 0.16 * clamp(1. - uWash * 1.5, 0., 1.));   // lichen along the ridges
  float topness = smoothstep(0.4, 0.85, n.y) * step(0.5, vBark.w) * clamp(1. - uWash * 1.5, 0., 1.);
  float clump = vnoise(vP.xz * 2.3) * 0.6 + vnoise(vP.xz * 6.7) * 0.4;
  col = mix(col, mix(vec3(0.13, 0.24, 0.11), uMint * mix(0.78, 0.6, isRoot), smoothstep(0.35, 0.75, clump)), topness * 0.75 * smoothstep(0.32, 0.6, clump + 0.12 * sinew * isRoot));
  vec2 pc = vP.xz * 4.2, pid = floor(pc), pf = fract(pc) - 0.5;
  float ph = hash21(pid), pet = step(0.86, ph) * smoothstep(0.34, 0.24, length(pf * vec2(1., 1.6) + (vec2(hash21(pid + 5.), hash21(pid + 8.)) - 0.5) * 0.3));
  col = mix(col, uPetalA * 0.85, pet * topness);
  float hollow = mix(mix(0.5, 0.85, isRoot), 1., smoothstep(1., 13., vP.y + length(vP.xz) * 0.3));
  col *= hemi(n) * mix(1., canopy(vP), mix(0.8, 0.55, isRoot)) * hollow * mix(1., 0.66 + 0.5 * smoothstep(-0.8, 0.9, n.y), isRoot);
  col *= smoothstep(-1.5, 0.3, vP.y) * 0.6 + 0.4;       // wet and dark at the waterline
${FINISH_Y}}`;

const ROCK_V = COMMON + FOG_V + /* glsl */`
varying vec3 vP, vN;
void main(){
  vP = position; vN = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_F = COMMON + FOG_F + /* glsl */`
varying vec3 vP, vN;
// one fallen petal per cell, turned and nudged; returns cover
float petalAt(vec2 p, float density){
  vec2 id = floor(p), f = fract(p) - 0.5;
  float h = hash21(id), a = h * 6.283;
  vec2 c = (vec2(hash21(id + 7.3), hash21(id + 3.1)) - 0.5) * 0.5, d = f - c;
  d = vec2(d.x * cos(a) + d.y * sin(a), -d.x * sin(a) + d.y * cos(a));
  float e = d.x * d.x / 0.085 + d.y * d.y / 0.03;
  return step(e, 1.) * step(hash21(id + 11.7), density);
}
void main(){
  if (vP.y < -1.1) discard;
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  float detail = clamp(1. - uWash * 1.3, 0., 1.);
  float px = fwidth(vP.x) + fwidth(vP.z);
  float fine = detail * clamp(1.4 - px * 5., 0., 1.), mid = detail * clamp(1.4 - px * 0.9, 0., 1.);
  float n1 = vnoise(vP.xz * 0.11), n2 = vnoise(vP.xz * 0.9 + 11.), n3 = vnoise(vP.xz * 4.3), n4 = vnoise(vP.xz * 17.);
  // wet dark rock with tilted strata, paler where it has dried on the ridges
  float strata = smoothstep(0.35, 0.65, fract(vP.y * 0.9 + vP.x * 0.07 + n2 * 0.6));
  vec3 rock = mix(uChar * 1.1, uSlate * 0.55, n1 * 0.6 + strata * 0.3 * detail) * mix(1., 0.6 + 0.8 * n3, mid);
  // cushion moss: rounded mounds half a metre across, dark in the seams between them
  vec2 cp = vP.xz * 1.6 + (vec2(n2, n3) - 0.5) * 1.1, ci = floor(cp), cf = fract(cp); float cd = 1., cd2 = 1.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = vec2(hash21(ci + g), hash21(ci + g + 5.7));
    float dd = length(g + o - cf); if (dd < cd) { cd2 = cd; cd = dd; } else cd2 = min(cd2, dd);
  }
  float cush = mix(0.6, smoothstep(0.7 + 0.2 * n3, 0.05, cd) * (0.5 + 0.5 * smoothstep(0.0, 0.16, cd2 - cd)), mid);   // domes with crisp dark seams
  float m = smoothstep(0.5, 0.75, n.y * 0.75 + n1 * 0.5 + n2 * 0.25 * detail) * smoothstep(0.1, 0.75, vP.y + (n3 - 0.5) * 0.3);
  vec3 moss = mix(vec3(0.1, 0.19, 0.1), mix(uMint * 0.6, vec3(0.27, 0.4, 0.22), 0.1 + 0.5 * n2 * n1 * 2.), cush * (0.75 + 0.25 * n2));
  moss *= mix(1., (0.74 + 0.52 * n4) * (0.84 + 0.32 * hash21(floor(vP.xz * 41.))), fine);     // star-moss stipple, crisp up close
  // hummocks: the carpet rises and falls, darker in its hollows, with bare strata showing between
  float hum = vnoise(vP.xz * 0.42 + 17.), relief = (vnoise(vP.xz * 0.42 + vec2(17.35, 17.)) - vnoise(vP.xz * 0.42 + vec2(16.65, 17.))) * 1.6;
  moss *= mix(1., (0.7 + 0.5 * hum) * clamp(1. + relief, 0.45, 1.6), detail);
  m *= mix(1., smoothstep(0.22, 0.42, hum + 0.25 * n2), detail * 0.85);
  vec3 col = mix(rock, moss, m);
  // drifts of fallen petals in the hollows, and a scatter everywhere under the crown
  float drift = smoothstep(0.45, 0.8, vnoise(vP.xz * 0.16 + 31.)) * smoothstep(110., 60., length(vP.xz));
  float dens = 0.07 + 0.8 * drift;
  float pet = max(petalAt(vP.xz * 4.2, dens), petalAt(vP.xz * 4.9 + 13.37, dens * 0.8));
  vec3 pcol = mix(uPink * 0.9, uWhite * 0.82, n4 * 0.6) * (0.78 + 0.2 * n3);
  col = mix(col, pcol, mix(drift * 0.45 * detail, pet, fine) * step(0.25, vP.y));
  col *= hemi(n) * canopy(vP);
  col *= mix(0.66, 1., smoothstep(-0.2, 0.9, vP.y + (n2 - 0.5) * 0.7));     // the wet band, ragged, and slate under the water
  col = mix(mix(uChar, uSlate, 0.6) * 0.72, col, smoothstep(-2.2, 0.1, vP.y + (n3 - 0.5) * 0.5));
${FINISH_Y}}`;

function makeMaterial(vs, fs, shared, grp, extra = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), shared, grp, extra.uniforms || {}),
    side: extra.side ?? THREE.FrontSide, transparent: !!extra.transparent, depthWrite: extra.depthWrite ?? true,
    alphaToCoverage: !!extra.a2c,
  });
}

// ======================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PAL).map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const lap = opts.lap ?? 1600, bigS = opts.bigS ?? 24, washMax = opts.wash ?? 0.7;
  const noise = makeNoise(Math.floor(rng() * 1e9));
  const hAt = makeIslandHeight(noise);
  const object = new THREE.Group(); object.name = 'sky-tree';

  // ---- geometry, built once ----
  const sk = await buildSkeleton(ctx, rng, hAt);
  const arches = await buildRoots(ctx, rng, sk.G, hAt, sk.rootAng);
  const [barkGeo, barkReflGeo] = accToGeometry(sk.G);
  await ctx.yield();
  const rockGeo = buildRock(hAt);
  await ctx.yield();

  // canopy-shade ellipsoids: the crown as a whole, then the great boughs
  const shade = [new THREE.Vector4(0, 62, 0, 46)];
  for (let i = 0; i < sk.boughShade.length && shade.length < NSH; i += 2) shade.push(sk.boughShade[i + 1]);
  while (shade.length < NSH) shade.push(new THREE.Vector4(0, -500, 0, 1));

  const shared = {
    uTime: { value: 0 }, uProgress: { value: 0.12 },
    uSky: { value: pal[0].clone().multiplyScalar(1.0) }, uBounce: { value: pal[3].clone().multiplyScalar(0.85) },
    uWashCol: { value: new THREE.Color('#E9EEF1') }, uShade: { value: shade },
    uPearl: { value: pal[0] }, uPink: { value: pal[1] }, uWhite: { value: pal[2] }, uSlate: { value: pal[3] },
    uChar: { value: pal[4] }, uGold: { value: pal[5] }, uMint: { value: pal[6] },
    uPetalA: { value: new THREE.Color(opts.petalA ?? pal[1]) }, uPetalB: { value: new THREE.Color(opts.petalB ?? pal[2]) },
    uLeaf: { value: new THREE.Vector4(0.3, 0.5, 0.2, 0) },
    uCamL: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(1280, 720) },
  };

  if (opts.leaf) { const lc = new THREE.Color(opts.leaf); shared.uLeaf.value.set(lc.r, lc.g, lc.b, opts.leafAmount ?? 0.3); }
  // layers: what one group draws. refl = drawn in the reflection groups too (reflGeo = a thinner copy)
  const layers = [
    { name: 'bark', geo: barkGeo, reflGeo: barkReflGeo, vs: BARK_V, fs: BARK_F, refl: true },
    { name: 'rock', geo: rockGeo, vs: ROCK_V, fs: ROCK_F, refl: false },
  ];
  const atlas = await makeBlossomAtlas(rng, ctx);
  await ctx.yield();
  const blossom = await buildBlossom(ctx, rng, sk.lobes, detail);
  layers.push({ name: 'blossom', geo: blossom.full, reflGeo: blossom.third, vs: BLOSSOM_V, fs: BLOSSOM_F, refl: true,
    extra: { a2c: true, side: THREE.DoubleSide, uniforms: { uAtlas: { value: atlas } } } });
  await ctx.yield();
  layers.push({ name: 'petals', geo: buildPetals(rng, detail), vs: PETAL_V, fs: PETAL_F, refl: false, extra: { side: THREE.DoubleSide } });
  const B = newBuilt(), pavilion = buildPavilion(B, rng, hAt, pal);
  await ctx.yield();
  const boat = buildJettyAndSkiff(B, rng, hAt, pal);
  const builtGeo = new THREE.BufferGeometry();
  builtGeo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); builtGeo.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  builtGeo.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3)); builtGeo.setAttribute('aB', new THREE.Float32BufferAttribute(B.ab, 4));
  builtGeo.setIndex(B.idx);
  layers.push({ name: 'built', geo: builtGeo, vs: BUILT_V, fs: BUILT_F, refl: true, extra: { side: THREE.DoubleSide, uniforms: { uSkiff: { value: boat.skiff } } } });
  await ctx.yield();
  const birdPal = pal.slice(); if (opts.birds === 'egret') { birdPal[3] = new THREE.Color('#F1F3EE'); birdPal[4] = new THREE.Color('#C9CED0'); }
  const craneGeo = buildCrane(birdPal), cranes = makeCraneFlight(rng, craneGeo, hAt);
  layers.push({ name: 'cranes', geo: craneGeo, vs: CRANE_V, fs: CRANE_F, refl: true, extra: { side: THREE.DoubleSide } });
  cranes.update(0.12, 0);
  await ctx.yield();
  /*LAYERS*/

  // ---- groups: the same buffers, four times ----
  const groups = {};
  for (const def of [{ name: 'A', mx: 1, my: 1 }, { name: 'FAR', mx: -1, my: 1 }, { name: 'FARr', mx: -1, my: -1 }, { name: 'Ar', mx: 1, my: -1 }]) {
    const g = new THREE.Group(); g.name = 'set-' + def.name;
    const grp = { uWash: { value: 0 }, uMist: { value: 0 }, uFogAmt: { value: 1 }, uRefl: { value: def.my < 0 ? 1 : 0 }, uFar: { value: def.name[0] === 'F' ? 1 : 0 }, uScale: { value: 1 }, uStretch: { value: 1 }, uCamSet: { value: new THREE.Vector3() } };
    for (const L of layers) {
      if (def.my < 0 && !L.refl) continue;
      const m = new THREE.Mesh(def.my < 0 && L.reflGeo ? L.reflGeo : L.geo, makeMaterial(L.vs, L.fs, shared, grp, L.extra));
      m.name = L.name; m.frustumCulled = false; m.renderOrder = L.order ?? 0; g.add(m);
    }
    g.userData = { def, grp }; groups[def.name] = g; object.add(g);
    await ctx.yield();
  }
  if (opts.water !== false) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(8000, 48), makeMaterial(WATER_V, WATER_F, shared, {}, { transparent: true, depthWrite: false }));
    w.rotation.x = -Math.PI / 2; w.name = 'viewer-water'; w.frustumCulled = false; w.renderOrder = 2; object.add(w);
  }
  /*WATER*/

  // ---- progress ----
  let progress = 0.12;
  const camW = new THREE.Vector3(), camL = new THREE.Vector3(), size = new THREE.Vector2();
  const A0 = 74, state = { S: bigS, a: A0, wash: 0.7, farZ: 0 };
  function place(camera) {
    camera.getWorldPosition(camW); camL.copy(camW); object.worldToLocal(camL);
    const u = progress, t = smoothstep(0.07, 0.68, u);
    // across the open water the ripples draw the far tree's reflection out toward us, as still water does
    const stretch = 1 + 1.15 * smoothstep(0.3, 0.46, u) * (1 - smoothstep(0.76, 0.9, u));
    // S is how far off the image really stands; a is how far off it LOOKS (set metres from the lens to the
    // trunk). a is held small while S is large, so the crown crosses the whole upper frame and leaves it
    // at the top until about u 0.22; then it draws down the sky. Both only ever go one way.
    const S = lerp(bigS, 1, t), a = lerp(A0, 535, Math.pow(smoothstep(0.1, 0.68, u), 1.5));
    // the far image rides ahead of the camera until it is life size; then it is island B, standing still
    const z = lerp(camL.z + S * a, lap, smoothstep(0.92, 1, t));
    // the pallor only ever drains: a function of u alone, with a last breath of air that is gone by u 0.9.
    // The image is never handed to the engine's distance fog (which would grey it again at 500 m).
    const veil = 1 - smoothstep(0.1, 0.6, u);
    state.S = S; state.a = a; state.farZ = z; state.wash = washMax * veil * Math.sqrt(veil) + 0.1 * smoothstep(0.1, 0.5, u) * (1 - smoothstep(0.62, 0.9, u));
    for (const k of ['FAR', 'FARr']) {
      const g = groups[k], d = g.userData;
      g.position.set(0, 0, z); g.scale.set(-S, d.def.my * S * (d.def.my < 0 ? stretch : 1), S);
      d.grp.uWash.value = state.wash * (d.def.my < 0 ? 0.6 : 1); d.grp.uMist.value = 0.92 * (1 - smoothstep(0.3, 0.56, u)); d.grp.uFogAmt.value = 0; d.grp.uScale.value = S; d.grp.uStretch.value = d.def.my < 0 ? stretch : 1;
    }
    groups.A.userData.grp.uCamSet.value.copy(camL);
    groups.FAR.userData.grp.uCamSet.value.set(-camL.x / S, camL.y / S, (camL.z - z) / S);
    const near = u < 0.3;                       // island A is behind us after that
    groups.A.visible = near; groups.Ar.visible = near;
    shared.uProgress.value = u; shared.uCamL.value.copy(camL);
  }

  // ---- anchors (local space of island A; +Z north, EAST IS -X) ----
  const toB = (v) => new THREE.Vector3(-v.x, v.y, lap + v.z);          // the same place on island B (mirrored)
  const arch = arches[0];
  const anchors = {
    toB,                                                               // function: A-local point -> the arrival island
    // where the path starts: 34 m short of the root arch that holds the ring on island B, so the first picture
    // (and the one seen through the portal before) is that same arch standing as a gate at the south tip, the
    // trunk to port of it, the pavilion and the gold sail to starboard, the pale giant beyond
    entry: { position: EN(26, 10, -70), direction: V3(0, 0, 1) },
    // exit ring (radius 7) under the tallest root arch OF ISLAND B; `local` is the same seat on island A
    portalSeat: { position: toB(arch.c), facing: V3(0, 0, 1), radius: 7, local: arch.c.clone(), archSpan: arch.span, archHeight: arch.height },
    // a safe line in A-local space: under the crown, past pavilion and sail, out over the northern tail
    flyOut: [EN(26, 10, -70), EN(26, 10, -10), EN(26, 10, 40), EN(26, 11, 100), EN(24, 14, 150), EN(20, 18.5, 215), EN(12, 23, 300)],
    // the last 300 m in world space (island B): 26 m west of trunk B, level at y 10, through the arch
    flyIn: [toB(EN(22, 12, -330)), toB(EN(26, 11, -200)), toB(EN(26, 10, -120)), toB(EN(26, 9.5, -60)), toB(arch.c)],
    pavilion: pavilion.c.clone(), pavilionTop: pavilion.top,          // floor centre; 20 m to starboard of flyOut
    sail: boat.sail.clone(), skiff: boat.skiff.clone(), jetty: boat.jetty.clone(),   // sail is about 23 m to starboard of flyOut
    cranesStand: V3(-35, 1, 128), cranesLand: V3(-36, 1, -68),         // shallows where the twelve stand at start / end
    rootArches: arches.map((a) => ({ center: a.c.clone(), span: a.span, height: a.height })),
    trunkTop: sk.axis(64), crownCenter: V3(0, 62, 0), crownRadius: 62, hemY: 30,
    islandNorthTip: V3(0, 0, 200), islandSouthTip: V3(0, 0, -60),
    viewpoints: [EN(26, 10, -30), EN(60, 40, -190), EN(-120, 30, 60)],
  };
  /*ANCHORS*/
  return {
    object, radius: 75, height: 120, center: new THREE.Vector3(0, 50, 0), anchors, groups, uniforms: shared, state,
    heightAt: hAt,
    // for the world's own growths (ferns, saplings, reeds): the same light, wash and fog as the set
    glsl: { COMMON, FOG_V, FOG_F, FINISH, FINISH_Y },
    makeSetMaterial(groupName, vs, fs, extra) { return makeMaterial(vs, fs, shared, groups[groupName].userData.grp, extra); },
    setProgress(u) { progress = clamp(u, 0, 1); },
    // where the far image stands at progress u for a lens at world z = camZ: { S, a, z } (the same sums as place())
    imageAt(u, camZ) {
      const t = smoothstep(0.07, 0.68, u), S = lerp(bigS, 1, t), a = lerp(A0, 535, Math.pow(smoothstep(0.1, 0.68, u), 1.5));
      return { S, a, z: lerp(camZ + S * a, lap, smoothstep(0.92, 1, t)) };
    },
    // the world may lay the cranes' whole course again (keys in u, points in set space) once it has its path
    setCraneCourse(keys, pts) { cranes.setCourse(keys, pts); },
    craneCourse: () => ({ keys: cranes.keys(), at: cranes.at }),
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); shared.uRes.value.copy(size); }
      place(camera);
      cranes.update(progress, time);
      /*UPDATE*/
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}

// ---- blossom ------------------------------------------------------------------------------------------
// Atlas of four sprays of five-petalled flowers. R = petal tone (0 rim .. 1 throat), G = gold stamens,
// B = depth inside the spray (1 front, darker behind), A = cover. Colour comes from the palette in the shader.
async function makeBlossomAtlas(rng, ctx) {
  const N = 1024, C = N / 2, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * C, oy = Math.floor(cell / 2) * C;
    g.save(); g.beginPath(); g.rect(ox, oy, C, C); g.clip();
    const flowers = 46;
    for (let i = 0; i < flowers; i++) {
      // sprays are loose discs with a ragged rim; back flowers first, smaller and darker
      const back = i < flowers * 0.4, a = rng() * TAU, rr = Math.sqrt(rng()) * (C * 0.5 - 44);
      const x = ox + C / 2 + Math.cos(a) * rr, y = oy + C / 2 + Math.sin(a) * rr * 0.92;
      const R = (back ? rng.range(20, 27) : rng.range(27, 36)), rot = rng() * TAU, depth = back ? rng.range(0.5, 0.72) : rng.range(0.85, 1);
      const b = Math.round(depth * 255);
      for (let p = 0; p < 5; p++) {
        const pa = rot + (p / 5) * TAU + rng.range(-0.08, 0.08), px = x + Math.cos(pa) * R * 0.56, py = y + Math.sin(pa) * R * 0.56;
        const gr = g.createRadialGradient(x, y, R * 0.1, x, y, R * 1.05);
        gr.addColorStop(0, `rgb(255,0,${b})`); gr.addColorStop(0.45, `rgb(120,0,${b})`); gr.addColorStop(1, `rgb(0,0,${b})`);
        g.fillStyle = gr; g.beginPath(); g.ellipse(px, py, R * 0.52, R * 0.36, pa, 0, TAU); g.fill();
      }
      // stamens: a ring of gold dots round the throat
      g.fillStyle = `rgb(200,255,${b})`;
      for (let k = 0; k < 7; k++) { const sa = rot + k * 0.9, sr = R * (0.12 + 0.1 * (k % 2)); g.beginPath(); g.arc(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr, Math.max(1.6, R * 0.055), 0, TAU); g.fill(); }
    }
    g.restore();
    await ctx.yield();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  return tex;
}

// Cards on the skins of the lobes at every branch tip: a cauliflower of cloud. aC = centre, size.
// aD = atlas cell, baked shade (0 dusky inside .. 1 luminous skin), spin, seed.
async function buildBlossom(ctx, rng, lobes, detail) {
  const total = Math.round(9600 * detail), aC = [], aD = [];
  let wsum = 0; for (const l of lobes) wsum += l.r * l.r;
  const crown = V3(0, 58, 0), d = V3(), out = V3();
  for (let li = 0; li < lobes.length; li++) {
    const l = lobes[li], n = Math.max(6, Math.round(total * l.r * l.r / wsum));
    for (let i = 0; i < n; i++) {
      const z = rng.range(-1, 1), a = rng() * TAU, s = Math.sqrt(1 - z * z), rr = l.r * rng.range(0.62, 1.04);
      d.set(s * Math.cos(a), z * 0.72, s * Math.sin(a));
      const x = l.c.x + d.x * rr, y = l.c.y + d.y * rr + 1.5, zz = l.c.z + d.z * rr;
      out.set(x - crown.x, (y - crown.y) * 1.3, zz - crown.z).normalize();
      // luminous where the card faces out of the crown, dusky where it faces the trunk
      const face = 0.5 + 0.5 * (out.x * d.x + out.y * d.y / 0.72 * 0.8 + out.z * d.z);
      // ...and each lobe is lit like a cumulus: bright on top, rose underneath
      const shade = clamp(0.08 + 0.95 * (0.5 * smoothstep(0.15, 0.85, face) + 0.5 * smoothstep(-0.75, 0.65, d.y / 0.72)) * (0.8 + 0.2 * rng()), 0, 1);
      aC.push(x, y, zz, rng.range(4.2, 6.0)); aD.push(Math.floor(rng() * 4), shade, rng() * TAU, rng());
    }
    if (li % 40 === 39) await ctx.yield();
  }
  // shuffle so that any leading share of the instances is an even thinning (the reflection draws a third)
  const count = aC.length / 4, order = rng.shuffle(Array.from({ length: count }, (_, i) => i));
  const C = new Float32Array(count * 4), D = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) for (let k = 0; k < 4; k++) { C[i * 4 + k] = aC[order[i] * 4 + k]; D[i * 4 + k] = aD[order[i] * 4 + k]; }
  const mk = (n) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = n;
    return g;
  };
  const full = mk(count), third = mk(Math.floor(count / 3));
  const bc = new THREE.InstancedBufferAttribute(C, 4), bd = new THREE.InstancedBufferAttribute(D, 4);
  for (const g of [full, third]) { g.setAttribute('aC', bc); g.setAttribute('aD', bd); }
  return { full, third, count };
}

const BLOSSOM_V = COMMON + FOG_V + /* glsl */`
attribute vec4 aC, aD; uniform float uScale, uRefl;
varying vec2 vUv, vQ; varying vec3 vL;   // vL: baked shade, seen-from-below, seed
void main(){
  vec3 c = aC.xyz; c += swayOf(c);
  float tr = uTime * 1.7 + aD.w * 40.;
  c += vec3(sin(tr), sin(tr * 1.31 + 1.), cos(tr * 0.87)) * 0.07;            // clusters tremble
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
  float ro = aD.z + sin(tr * 0.6) * 0.06, cs = cos(ro), sn = sin(ro);
  float grow = aC.w * uScale * (1. + 0.7 * uWash) * (1. + 0.6 * uRefl);
  mvPosition.xy += mat2(cs, -sn, sn, cs) * position.xy * grow;
  gl_Position = projectionMatrix * mvPosition;
  vQ = position.xy;
  vUv = (position.xy + 0.5) * 0.5 + vec2(mod(aD.x, 2.), floor(aD.x * 0.5)) * 0.5;
  vec3 toC = (modelMatrix * vec4(c, 1.)).xyz - cameraPosition;
  float below = clamp(toC.y * (1. - 2. * uRefl) / max(length(toC), 1e-3), 0., 1.);
  vL = vec3(aD.y, below, aD.w);
  #include <fog_vertex>
}`;
const BLOSSOM_F = COMMON + FOG_F + /* glsl */`
uniform sampler2D uAtlas; uniform vec3 uPetalA, uPetalB; uniform vec4 uLeaf;
varying vec2 vUv, vQ; varying vec3 vL;
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  // far off, and in the washed sky image, sprays close up into cloud: a ragged disc of their mean tone
  float texels = fwidth(vUv.x) * 1024.;
  float soft = clamp(max((texels - 1.6) / 3.5, uWash * 1.5), 0., 1.);
  float r = length(vQ) * 2. + (vnoise(vQ * 5. + vL.z * 30.) - 0.5) * 0.55;
  float disc = smoothstep(1.0, 0.6, r);
  float a = mix(t.a, disc, soft);
  if (a < 0.42) discard;
  float mott = 0.6 * vnoise(vQ * 9. + vL.z * 20.) + 0.4 * vnoise(vQ * 23. + vL.z * 7.);
  float tone = mix(t.r, 0.25 + 0.6 * mott, soft), depth = mix(mix(0.55, 1., t.b), 0.74 + 0.26 * mott, soft);
  vec3 petal = mix(uPetalA * 0.86, uPetalB * 0.8, tone * tone * 0.85 + 0.1);
  petal = mix(petal, uGold * 0.62, t.g * (1. - soft) * 0.75);
  petal = mix(petal, uLeaf.rgb * (0.6 + 0.5 * mott), step(0.001, uLeaf.a) * mix(step(t.b, 0.62), smoothstep(0.45, 0.6, mott), soft) * min(uLeaf.a * 2.6, 1.));   // season: new leaf among the blossom
  // baked gradient: luminous at the crown's skin, dusky inside, the shade tinted rose and never grey
  float light = mix(0.4, 1., vL.x) * depth * mix(0.82, 1.06, vQ.y + 0.5);
  vec3 tint = mix(uPetalA * 0.86, vec3(1.), vL.x);        // the shade takes the season's own colour, never grey
  // petals transmit: from below the crown glows pink against the sky
  light = mix(light, 0.92 * depth, vL.y * 0.8);
  vec3 col = petal * tint * light * uSky;
  col = mix(col, uPetalA * 0.8 * depth * uSky, vL.y * 0.45);
  col = lessWash(col, 0.62);                                          // the giant's crown holds its colour
${FINISH}  gl_FragColor.a = a;
}`;

// ---- falling petals: a closed form of time. Half ride with the lens, half fill the air round the tree ----
function buildPetals(rng, detail) {
  const n = Math.round(3800 * detail), P = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) P[i] = rng();
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = n;
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4));
  return g;
}
const PETAL_V = COMMON + FOG_V + /* glsl */`
attribute vec4 aP; uniform float uScale, uFar; uniform vec3 uCamSet; uniform vec2 uRes;
varying vec2 vQ; varying vec3 vL;
void main(){
  float near = step(0.5, fract(aP.w * 7.31));                        // which population
  // the lens box shrinks with the far image's size so that giant petals still pass close by
  float b = 1. / (1. + 7. * (uScale - 1.) / 23.);
  vec3 box = mix(vec3(250., 130., 250.), vec3(56., 60., 56.) * b, near);
  vec3 o = vec3(aP.x, aP.y, aP.z) * box;
  o.y -= uTime * 1.1;                                                 // 1.1 m/s, in the set's own metres
  float fl = uTime * (0.5 + aP.w * 0.4) + aP.w * 50.;
  o.xz += vec2(sin(fl), cos(fl * 0.83)) * 0.6 + vec2(sin(fl * 0.31), cos(fl * 0.27)) * 1.5;
  vec3 mid = mix(vec3(0., 65., 0.), uCamSet, near);
  vec3 c = mid + mod(o - mid + box * 0.5, box) - box * 0.5;          // wraps top to bottom, never lands
  float keep = step(length(c.xz), 124.) * step(0.2, c.y) * step(c.y, 128.);
  // tumbling: a slow roll round a drifting axis
  float a1 = aP.w * 40. + uTime * (0.7 + aP.x), a2 = aP.z * 30. + uTime * (0.45 + aP.y * 0.5);
  vec3 nn = vec3(cos(a1) * sin(a2), cos(a2) * 0.6 + 0.5, sin(a1) * sin(a2));
  nn = normalize(nn + vec3(0., 1e-3, 0.));
  vec3 t1 = normalize(cross(nn, vec3(0.3, 0.1, 0.9)) + vec3(1e-4)), t2 = cross(nn, t1);
  vec4 mvc = modelViewMatrix * vec4(c, 1.);
  float size = 0.15;
  float px = size * uScale * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mvc.z, 0.1);
  size *= max(1., 1.7 / max(px, 1e-3));                               // never thinner than about 1.7 pixels
  // the giant's petals reach us only once we are out from under the real crown (u 0.06 to 0.1)
  float come = mix(1., smoothstep(0.065, 0.11, uProgress + 0.03 * (aP.x - 0.5)), uFar * near * step(1.5, uScale));
  vec3 p = c + (t1 * position.x * 0.8 + t2 * position.y) * size * come;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  // the far image's petals keep 6 m clear of the lens
  if (keep < 0.5 || come < 0.02 || (uFar > 0.5 && -mvc.z < 6. + 2. * uScale * 0.15)) gl_Position = vec4(2., 2., 2., 1.);
  vQ = position.xy;
  vL = vec3(nn.y, canopy(c), aP.w);
  #include <fog_vertex>
}`;
const PETAL_F = COMMON + FOG_F + /* glsl */`
uniform vec3 uPetalA, uPetalB;
varying vec2 vQ; varying vec3 vL;
void main(){
  // one petal: a broad oval, pinched at the base, notched at the tip
  vec2 q = vQ * 2.; float w = 0.95 * sqrt(max(1. - q.y * q.y, 0.)) * (0.62 + 0.38 * q.y);
  float notch = smoothstep(0.0, 0.22, abs(q.x)) + step(q.y, 0.62);
  if (abs(q.x) > w || notch < 0.5) discard;
  float under = gl_FrontFacing ? 0. : 1.;
  vec3 col = mix(uPetalA * 0.92, uPetalB * 0.84, 0.4 * under + 0.4 * (q.y * 0.5 + 0.5)) * (0.9 + 0.1 * smoothstep(0.0, 0.25, abs(q.x)));
  col *= uSky * mix(0.72, 1., abs(vL.x)) * mix(1., vL.y, 0.6);
  col = lessWash(col, 0.55);                                          // the giant's petals keep some of their rose
${FINISH}}`;

// ---- a plain water sheet for the viewer (the world lays its own): slate straight down, pearl at a glance ----
const WATER_V = COMMON + FOG_V + /* glsl */`
varying vec3 vW;
void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_F = COMMON + FOG_F + /* glsl */`
varying vec3 vW;
void main(){
  vec3 v = cameraPosition - vW; float d = length(v); v /= max(d, 1e-3);
  float rip = vnoise(vW.xz * 0.35 + uTime * vec2(0.11, 0.07)) - 0.5;
  float f = 1. - clamp(abs(v.y) + rip * 0.06, 0., 1.); f = f * f * f;
  vec3 col = mix(uChar * 0.9, uPearl * 0.8, f);
  gl_FragColor = vec4(col, mix(0.62, 0.5, f));
  #include <fog_fragment>
}`;

// ---- built things: pavilion, jetty, skiff. One merged mesh; aB = material kind, wave weight, u, v ----
// kinds: 0 painted timber / stone, 1 shingle, 2 sailcloth, 3 bare plank, 4 straw; kind + 10 = rides the skiff
function newBuilt() { return { pos: [], nor: [], col: [], ab: [], idx: [], n: 0 }; }
function bQuad(B, a, b, c, d, color, kind, uv) {
  const n = V3().subVectors(b, a).cross(V3().subVectors(d, a)).normalize(), base = B.n;
  [a, b, c, d].forEach((p, i) => {
    B.pos.push(p.x, p.y, p.z); B.nor.push(n.x, n.y, n.z); B.col.push(color.r, color.g, color.b);
    B.ab.push(kind, 0, uv ? uv[i * 2] : 0, uv ? uv[i * 2 + 1] : 0);
  });
  B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); B.n += 4;
}
// a box with its own yaw, tapering toward the top by `taper`
function bBox(B, c, sx, sy, sz, color, kind = 0, yaw = 0, taper = 0) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const P = (x, y, z) => { const k = y > 0 ? 1 - taper : 1; x *= k; z *= k; return V3(c.x + x * cs + z * sn, c.y + y, c.z - x * sn + z * cs); };
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
  const top = color.clone().multiplyScalar(1.08), dark = color.clone().multiplyScalar(0.8);
  bQuad(B, v[4], v[5], v[6], v[7], color, kind); bQuad(B, v[1], v[0], v[3], v[2], color, kind);
  bQuad(B, v[5], v[1], v[2], v[6], color, kind); bQuad(B, v[0], v[4], v[7], v[3], color, kind);
  bQuad(B, v[7], v[6], v[2], v[3], top, kind); bQuad(B, v[0], v[1], v[5], v[4], dark, kind);
}
function bCyl(B, p0, p1, r0, r1, segs, color, kind = 0) {
  const ax = V3().subVectors(p1, p0).normalize(), s = Math.abs(ax.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
  const u = V3().crossVectors(ax, s).normalize(), w = V3().crossVectors(ax, u), base = B.n;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU, c = Math.cos(a), sn = Math.sin(a);
    for (const [p, r] of [[p0, r0], [p1, r1]]) {
      B.pos.push(p.x + (u.x * c + w.x * sn) * r, p.y + (u.y * c + w.y * sn) * r, p.z + (u.z * c + w.z * sn) * r);
      B.nor.push(u.x * c + w.x * sn, u.y * c + w.y * sn, u.z * c + w.z * sn); B.col.push(color.r, color.g, color.b); B.ab.push(kind, 0, i / segs, 0);
    }
  }
  for (let i = 0; i < segs; i++) { const a = base + i * 2; B.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  B.n += (segs + 1) * 2;
}

function buildPavilion(B, rng, hAt, pal) {
  const c = V3(PAV.x, 0, PAV.z), gy = Math.max(hAt(c.x, c.z), 2.6), yaw = rng.range(-0.25, 0.25);
  const white = new THREE.Color('#e9e6dc'), stone = pal[3].clone().lerp(pal[0], 0.45), shingle = new THREE.Color('#7d8580');
  const cs = Math.cos(yaw), sn = Math.sin(yaw), L = (x, y, z) => V3(c.x + x * cs + z * sn, gy + y, c.z - x * sn + z * cs);
  // rock terrace: two stone steps, sunk well into the mound so no edge floats
  bBox(B, L(0, -1.0, 0), 9.6, 3.0, 9.6, stone.clone().multiplyScalar(0.8), 0, yaw, 0.04);
  bBox(B, L(0, 0.62, 0), 8.2, 0.36, 8.2, stone, 0, yaw, 0.02);
  const f = 0.8;                                           // floor level
  // eight posts on a 3 x 3 plan without the middle, each on a base stone, with a bracket block under the beam
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    if (!i && !j) continue;
    const x = i * 3.1, z = j * 3.1;
    bBox(B, L(x, f + 0.12, z), 0.6, 0.24, 0.6, stone, 0, yaw, 0.15);
    bBox(B, L(x, f + 2.35, z), 0.3, 4.3, 0.3, white, 0, yaw, 0.12);
    bBox(B, L(x, f + 4.4, z), 0.7, 0.22, 0.7, white, 0, yaw, -0.25);
  }
  // ring beams and a low rail on three sides
  for (const s of [-1, 1]) {
    bBox(B, L(0, f + 4.7, s * 3.1), 7.4, 0.36, 0.3, white, 0, yaw); bBox(B, L(s * 3.1, f + 4.7, 0), 0.3, 0.36, 7.4, white, 0, yaw);
    bBox(B, L(s * 3.1, f + 0.75, 0), 0.1, 0.1, 6.0, white, 0, yaw);
  }
  bBox(B, L(0, f + 0.75, 3.1), 6.0, 0.1, 0.1, white, 0, yaw);
  // hipped roof with upturned eaves: a concave sheet, lifted at the corners, shingled in the shader
  const NR = 10, eave = f + 4.85, half = 5.0, rise = 3.1;
  const roof = (u, v) => { const m = 1 - Math.max(Math.abs(u), Math.abs(v)); return L(u * half, eave + rise * Math.pow(m, 1.55) + 0.75 * Math.pow(Math.abs(u * v), 2.2), v * half); };
  for (let i = 0; i < NR; i++) for (let j = 0; j < NR; j++) {
    const u0 = -1 + (2 * i) / NR, u1 = -1 + (2 * (i + 1)) / NR, v0 = -1 + (2 * j) / NR, v1 = -1 + (2 * (j + 1)) / NR;
    const mm = (u, v) => 1 - Math.max(Math.abs(u), Math.abs(v));
    bQuad(B, roof(u0, v1), roof(u1, v1), roof(u1, v0), roof(u0, v0), shingle, 1, [mm(u0, v1), 0, mm(u1, v1), 0, mm(u1, v0), 0, mm(u0, v0), 0]);
  }
  // finial: a dull gold bead and spike (the sail keeps the bright gold)
  const fin = pal[5].clone().multiplyScalar(0.55);
  bCyl(B, L(0, eave + rise - 0.1, 0), L(0, eave + rise + 0.35, 0), 0.34, 0.2, 8, fin); bCyl(B, L(0, eave + rise + 0.35, 0), L(0, eave + rise + 1.25, 0), 0.2, 0.02, 8, fin);
  // low table, two cups
  bBox(B, L(0.3, f + 0.42, -0.2), 1.5, 0.08, 0.85, new THREE.Color('#5a3d2c'), 3, yaw);
  for (const s of [-1, 1]) { bBox(B, L(0.3 + s * 0.6, f + 0.19, -0.2), 0.1, 0.38, 0.7, new THREE.Color('#4a3024'), 3, yaw);
    bCyl(B, L(0.3 + s * 0.3, f + 0.46, -0.2 + s * 0.12), L(0.3 + s * 0.3, f + 0.56, -0.2 + s * 0.12), 0.045, 0.06, 7, pal[2].clone().multiplyScalar(0.8)); }
  return { c: V3(c.x, gy + f, c.z), top: gy + eave + rise + 1.25 };
}

function buildJettyAndSkiff(B, rng, hAt, pal) {
  const wood = new THREE.Color('#6b5a4a'), dark = new THREE.Color('#33291f'), z0 = JETTY_Z;
  let xs = -8; while (xs > -50 && hAt(xs, z0) > 0.5) xs -= 0.5;          // the east shore
  const xe = xs - 12, deck = 0.95;
  for (let i = 0; i < 29; i++) {                                         // planks, none quite square
    const x = xs + 1.2 - i * 0.455;
    bBox(B, V3(x, deck + rng.range(-0.015, 0.015), z0 + rng.range(-0.05, 0.05)), 0.42, 0.07, 1.5 + rng.range(-0.08, 0.08), wood.clone().multiplyScalar(rng.range(0.75, 1.15)), 3, rng.range(-0.02, 0.02));
  }
  for (const s of [-1, 1]) bBox(B, V3((xs + xe) / 2 + 0.6, deck - 0.14, z0 + s * 0.55), 13.2, 0.16, 0.12, dark, 3);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {                 // stilts in leaning pairs
    const x = xs - 0.3 - i * 2.3, top = i === 5 && s === 1 ? 2.1 : deck + 0.02;
    bCyl(B, V3(x + rng.range(-0.1, 0.1), -2.6, z0 + s * 0.78), V3(x, top, z0 + s * 0.66), 0.1, 0.085, 6, dark, 3);
  }
  // skiff, 7.5 m, moored alongside the jetty's end with her bow to the north
  const xc = xe - 2.9, zc = z0 + 1.85, NS = 10, skiff0 = B.n, K = 13, hull = new THREE.Color('#2f3a3d'), inner = new THREE.Color('#8a7358');
  const st = (i) => {
    const s = -1 + (2 * i) / NS, a = Math.abs(s), b = (s < 0 ? 0.92 - 0.42 * a * a * a : 0.92 * Math.pow(1 - Math.pow(a, 2.4), 0.7)) + 0.02;
    const yg = 0.52 + 0.3 * s * s + (s > 0 ? 0.25 * s * s * s : 0), yk = -0.16 + 0.42 * a * a * a;
    return { z: zc + s * 3.75, b, yg, yk };
  };
  for (let i = 0; i < NS; i++) {
    const A = st(i), Bn = st(i + 1);
    for (const sd of [-1, 1]) {
      const pA = [V3(xc + sd * A.b, A.yg, A.z), V3(xc + sd * A.b * 0.82, lerp(A.yk, A.yg, 0.3), A.z), V3(xc, A.yk, A.z)];
      const pB = [V3(xc + sd * Bn.b, Bn.yg, Bn.z), V3(xc + sd * Bn.b * 0.82, lerp(Bn.yk, Bn.yg, 0.3), Bn.z), V3(xc, Bn.yk, Bn.z)];
      for (let k = 0; k < 2; k++) {
        if (sd > 0) bQuad(B, pA[k + 1], pA[k], pB[k], pB[k + 1], k ? hull.clone().multiplyScalar(0.8) : hull, K);
        else bQuad(B, pB[k + 1], pB[k], pA[k], pA[k + 1], k ? hull.clone().multiplyScalar(0.8) : hull, K);
      }
      // gunwale rail, and pale floor inside
      bBox(B, V3(xc + sd * (A.b + Bn.b) / 2, (A.yg + Bn.yg) / 2 + 0.03, (A.z + Bn.z) / 2), 0.09, 0.08, 0.78, inner, K, Math.atan2(sd * (Bn.b - A.b), 0.75));
    }
    bQuad(B, V3(xc - A.b * 0.8, A.yk + 0.14, A.z), V3(xc - Bn.b * 0.8, Bn.yk + 0.14, Bn.z), V3(xc + Bn.b * 0.8, Bn.yk + 0.14, Bn.z), V3(xc + A.b * 0.8, A.yk + 0.14, A.z), inner.clone().multiplyScalar(0.7), K);
  }
  const tr = st(0); bQuad(B, V3(xc - tr.b, tr.yg, tr.z), V3(xc + tr.b, tr.yg, tr.z), V3(xc, tr.yk, tr.z), V3(xc, tr.yk, tr.z), hull, K);   // transom
  for (const s of [-0.45, 0.2]) bBox(B, V3(xc, 0.42, zc + s * 3.75), 1.7, 0.05, 0.3, inner, K);                      // thwarts
  // straw hat on the after thwart; pole over the stern
  const straw = new THREE.Color('#c9b27a'), hp = V3(xc + 0.3, 0.45, zc - 0.45 * 3.75);
  bCyl(B, hp, hp.clone().add(V3(0, 0.03, 0)), 0.36, 0.3, 10, straw, 14); bCyl(B, hp.clone().add(V3(0, 0.03, 0)), hp.clone().add(V3(0, 0.2, 0)), 0.3, 0.04, 10, straw, 14);
  bCyl(B, V3(xc + 0.35, 0.75, zc - 0.6), V3(xc - 0.25, 1.5, zc - 6.6), 0.04, 0.03, 5, wood, K);
  // mast, yard and the gold lugsail, 7 m tall, set fore and aft so the path sees it broadside
  const mz = zc + 0.5;
  bCyl(B, V3(xc, 0, mz), V3(xc, 7.9, mz), 0.085, 0.05, 7, wood, K);
  const tack = V3(xc + 0.1, 1.25, mz + 1.5), clew = V3(xc + 0.1, 1.55, mz - 3.0), peak = V3(xc + 0.1, 8.2, mz - 2.5), throat = V3(xc + 0.1, 5.7, mz + 1.9);
  bCyl(B, throat.clone().lerp(peak, -0.08), peak.clone().lerp(throat, -0.06), 0.05, 0.04, 6, wood, K);
  bCyl(B, tack.clone().lerp(clew, -0.05), clew.clone().lerp(tack, -0.05), 0.045, 0.04, 6, wood, K);
  const gold = pal[5], NU = 8, NV = 10, base = B.n;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU, v = j / NV, p = tack.clone().lerp(clew, u).lerp(throat.clone().lerp(peak, u), v);
    const w = Math.sin(Math.PI * Math.min(u * 1.15, 1)) * Math.sin(Math.PI * (0.08 + 0.84 * v));   // held at mast, yard and boom
    B.pos.push(p.x, p.y, p.z); B.nor.push(1, 0, 0); B.col.push(gold.r, gold.g, gold.b); B.ab.push(12, w, u, v);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + NU + 1; B.idx.push(a, a + 1, b, a + 1, b + 1, b); }
  B.n += (NU + 1) * (NV + 1);
  // she lies bow to the east: turn everything built so far for her a quarter turn about her own centre,
  // so the sail stands broadside to whoever comes up from the south (the entry, the giant, the arrival)
  for (let i = skiff0; i < B.n; i++) {
    const dx = B.pos[i * 3] - xc, dz = B.pos[i * 3 + 2] - zc, nx = B.nor[i * 3], nz = B.nor[i * 3 + 2];
    B.pos[i * 3] = xc - dz; B.pos[i * 3 + 2] = zc + dx; B.nor[i * 3] = -nz; B.nor[i * 3 + 2] = nx;
  }
  // mooring post and line
  bCyl(B, V3(xe - 0.3, deck + 1.1, z0 + 0.66), V3(xc + 3.0, 0.95, zc - 0.5), 0.03, 0.03, 4, straw.clone().multiplyScalar(0.7), 3);
  return { jetty: V3((xs + xe) / 2, deck, z0), skiff: V3(xc, 0.2, zc), sail: V3(xc + 0.1, 4.6, zc + 0.1), shoreX: xs };
}

const BUILT_V = COMMON + FOG_V + /* glsl */`
attribute vec3 color; attribute vec4 aB; uniform vec3 uSkiff;
varying vec3 vP, vN, vC; varying vec4 vB;
void main(){
  vec3 p = position, n = normal; float kind = aB.x, ride = step(9.5, kind); kind -= 10. * ride;
  if (kind > 1.5 && kind < 2.5) {
    // the lugsail: a standing belly, and a luff that runs up the cloth
    float lf = sin(uTime * 2.3 - aB.w * 5. + aB.z * 2.5) * 0.16 + sin(uTime * 0.6) * 0.1;
    p.z -= aB.y * (0.55 + lf);
    n = normalize(vec3((aB.z - 0.5) * 0.9, 0.25 * cos(uTime * 2.3 - aB.w * 5. + aB.z * 2.5), -1.));
  }
  // the skiff rocks and tugs at her line
  vec3 d = p - uSkiff; float ro = 0.04 * sin(uTime * 0.83), pi = 0.012 * sin(uTime * 0.61 + 1.);
  d.zy = mat2(cos(ro), -sin(ro), sin(ro), cos(ro)) * d.zy; d.yx += vec2(-d.x, d.y) * pi;
  d.y += 0.05 * sin(uTime * 1.07); d.x += 0.12 * sin(uTime * 0.37);
  p = mix(p, uSkiff + d, ride);
  vP = p; vN = n; vC = color; vB = vec4(kind, aB.yzw);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BUILT_F = COMMON + FOG_F + /* glsl */`
varying vec3 vP, vN, vC; varying vec4 vB;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
  float detail = clamp(1. - uWash * 1.3, 0., 1.), k = vB.x;
  vec3 col = vC; float light = 1.;
  if (k > 0.5 && k < 1.5) {            // shingles in courses, each a little different; pale boards beneath
    float row = vB.z * 16., fr = fract(row), id = floor(row);
    if (!gl_FrontFacing) { col = vec3(0.62, 0.6, 0.55); detail = 0.; }
    float sh = hash21(vec2(floor((vP.x + vP.z) * 2.2 + id * 0.5), id));
    col *= mix(1., (0.72 + 0.5 * sh) * mix(0.62, 1.1, fr), detail);
    col = mix(col, uMint * 0.4, smoothstep(0.55, 0.8, vnoise(vP.xz * 0.9)) * 0.5 * detail);   // moss on the roof
  } else if (k > 1.5 && k < 2.5) {     // sailcloth: seamed panels, light coming through
    float seam = smoothstep(0.04, 0.0, abs(fract(vB.w * 6.) - 0.5) - 0.46) ;
    col *= 0.86 + 0.14 * vnoise(vB.zw * vec2(30., 90.)) - 0.25 * (1. - seam) * detail;
    light = 1.18 + 0.25 * vB.y;
  } else if (k > 2.5) {                // bare timber and straw: grain
    col *= mix(1., 0.75 + 0.5 * vnoise(vec2(vP.x * 9. + vP.z * 9., vP.y * 30. + vP.z * 2.)), detail);
  } else col *= mix(1., 0.93 + 0.14 * vnoise(vP.xy * 6. + vP.z * 5.), detail);
  col *= hemi(n) * mix(1., canopy(vP), 0.75) * light;
  col *= mix(0.45, 1., smoothstep(-0.3, 0.5, vP.y));
  if (k > 1.5 && k < 2.5) col = lessWash(col, 0.5);
${FINISH_Y}}`;

// ---- cranes: one bird, +Z forward, 2.4 m span. aK = part (0 body, 1 neck and head, 2 wing, 3 leg), coordinate ----
function buildCrane(pal) {
  const C = { pos: [], nor: [], col: [], k: [], idx: [], n: 0 };
  const slate = pal[3], char = pal[4].clone().multiplyScalar(0.8), white = pal[2].clone().multiplyScalar(0.85), pale = pal[3].clone().lerp(pal[0], pal[3].r > 0.8 ? 0.35 : 0.08);
  const vert = (x, y, z, nx, ny, nz, c, part, k) => { C.pos.push(x, y, z); C.nor.push(nx, ny, nz); C.col.push(c.r, c.g, c.b); C.k.push(part, k, 0, 0); return C.n++; };
  // loft rings along z: st = [z, y, rx, ry, colour, k]
  const loft = (st, segs, part) => {
    const base = C.n;
    for (const [z, y, rx, ry, c, k] of st) for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * TAU, cx = Math.cos(a), sy = Math.sin(a);
      vert(cx * rx, y + sy * ry, z, cx, sy, 0, typeof c === 'function' ? c(a) : c, part, k);
    }
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < segs; j++) { const a = base + i * (segs + 1) + j, b = a + segs + 1; C.idx.push(a, a + 1, b, a + 1, b + 1, b); }
  };
  const belly = (a) => (Math.sin(a) < -0.3 ? pale : slate);
  loft([[-0.5, 0.02, 0.01, 0.01, char, 0], [-0.4, 0.02, 0.075, 0.05, char, 0], [-0.24, 0, 0.125, 0.1, belly, 0], [-0.02, -0.01, 0.16, 0.135, belly, 0],
    [0.2, 0, 0.145, 0.125, belly, 0], [0.34, 0.03, 0.09, 0.085, slate, 0], [0.4, 0.05, 0.055, 0.055, char, 0]], 7, 0);
  // neck stretched forward, head with the white cheek stripe, a long bill
  const cheek = (a) => (Math.abs(Math.cos(a)) > 0.55 && Math.sin(a) > -0.5 ? white : char);
  loft([[0.38, 0.05, 0.05, 0.05, char, 0], [0.6, 0.07, 0.04, 0.04, char, 0.25], [0.84, 0.08, 0.034, 0.034, cheek, 0.52], [1.02, 0.085, 0.036, 0.036, cheek, 0.72],
    [1.1, 0.09, 0.05, 0.047, cheek, 0.82], [1.17, 0.085, 0.036, 0.034, char, 0.9], [1.2, 0.08, 0.02, 0.018, pal[5].clone().multiplyScalar(0.45), 0.93], [1.36, 0.065, 0.004, 0.004, pal[5].clone().multiplyScalar(0.4), 1]], 6, 1);
  // legs trailing past the tail, toes together
  for (const s of [-1, 1]) {
    loft([[-0.2, -0.07, 0.03, 0.03, slate, 0], [-0.55, -0.05, 0.016, 0.016, char, 0.33], [-1.12, -0.03, 0.013, 0.013, char, 0.85], [-1.3, -0.035, 0.022, 0.008, char, 1]].map((r) => r.slice()), 4, 3);
    const n4 = 4 * 5; for (let i = C.n - n4; i < C.n; i++) C.pos[i * 3] += s * 0.06;
  }
  // wings: slate coverts in front, charcoal flight feathers behind, five fingered primaries
  for (const s of [-1, 1]) {
    const NW = 6, base = C.n;
    for (let i = 0; i <= NW; i++) {
      const w = i / NW, x = s * (0.12 + w * 0.98), le = 0.26 - 0.13 * w * w, ch = 0.44 - 0.12 * w - 0.1 * w * w * w;
      vert(x, 0.06, le, 0, 1, 0, slate, 2, s * w); vert(x, 0.085, le - ch * 0.42, 0, 1, 0, slate.clone().lerp(char, 0.25), 2, s * w); vert(x, 0.05, le - ch * (1 + 0.08 * Math.sin(w * 20)), 0, 1, 0, char, 2, s * w);
    }
    for (let i = 0; i < NW; i++) for (let j = 0; j < 2; j++) { const a = base + i * 3 + j, b = a + 3; C.idx.push(a, b, a + 1, a + 1, b, b + 1); }
    for (let f = 0; f < 5; f++) {
      const ang = -0.25 + f * 0.3, w0 = 0.9, x0 = s * (0.12 + w0 * 0.98), z0 = 0.13 - f * 0.055, len = 0.36 - f * 0.03, hw = 0.032;
      const dx = Math.cos(ang) * s, dz = -Math.sin(ang), px = -dz * hw * s, pz = dx * hw * s;
      const a = vert(x0 - px, 0.06, z0 - pz, 0, 1, 0, char, 2, s * w0), b = vert(x0 + px, 0.06, z0 + pz, 0, 1, 0, char, 2, s * w0);
      const c = vert(x0 + dx * len + px * 0.5, 0.06, z0 + dz * len + pz * 0.5, 0, 1, 0, char, 2, s * 1.22), d = vert(x0 + dx * len - px * 0.5, 0.06, z0 + dz * len - pz * 0.5, 0, 1, 0, char, 2, s * 1.22);
      C.idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(C.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(C.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C.col, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(C.k, 4));
  g.setIndex(C.idx);
  return g;
}
const N_CRANES = 12;
const CRANE_V = COMMON + FOG_V + /* glsl */`
uniform float uStretch;
attribute vec3 color; attribute vec4 aK, aI0, aI1, aI2;   // aI0 = place, yaw; aI1 = pitch, bank, phase, flap; aI2 = stand, cup, size
varying vec3 vP, vN, vC;
void main(){
  vec3 p = position, n = normal; float part = aK.x, flap = aI1.w, stand = aI2.x, cup = aI2.y;
  float ph = uTime * 7.5 + aI1.z;
  if (part > 1.5 && part < 2.5) {
    float w = abs(aK.y), sd = aK.y < 0. ? -1. : 1., r = abs(p.x) - 0.12;
    // the stroke: the hand lags the arm; cupped and held high when landing; folded when standing
    float ang = flap * ((0.58 * sin(ph) + 0.1) * min(w, 1.) + 0.2 * sin(ph - 1.2) * w * w) + cup * (0.38 + 0.22 * w);
    p.x = sd * (0.12 + r * cos(ang)); p.y += r * sin(ang); n = vec3(-sd * sin(ang), cos(ang), 0.);
    vec3 folded = vec3(sd * (0.13 + r * 0.05), position.y + 0.04 - r * 0.07, position.z - r * 0.52);
    p = mix(p, folded, stand);
  } else if (part > 0.5 && part < 1.5) {
    float a = stand * 1.3 * pow(max(aK.y, 1e-4), 0.6) - cup * 0.25 * aK.y; vec2 d = p.zy - vec2(0.38, 0.05);
    p.zy = vec2(0.38, 0.05) + mat2(cos(a), sin(a), -sin(a), cos(a)) * d;
    p.z -= stand * 0.22 * sin(aK.y * 3.14) ;                                   // the S of a standing neck
  } else if (part > 2.5) {
    float a = (stand * 1.5 + cup * 0.9) * smoothstep(0., 0.3, aK.y); vec2 d = p.zy - vec2(-0.2, -0.07);
    p.zy = vec2(-0.2, -0.07) + mat2(cos(a), sin(a), -sin(a), cos(a)) * d;
  }
  p.y -= flap * 0.035 * sin(ph);                                              // the body answers the stroke
  float pi = aI1.x + stand * 0.25, bk = aI1.y, yw = aI0.w;
  p.zy = mat2(cos(pi), sin(pi), -sin(pi), cos(pi)) * p.zy; n.zy = mat2(cos(pi), sin(pi), -sin(pi), cos(pi)) * n.zy;
  p.xy = mat2(cos(bk), sin(bk), -sin(bk), cos(bk)) * p.xy; n.xy = mat2(cos(bk), sin(bk), -sin(bk), cos(bk)) * n.xy;
  p.xz = vec2(p.x * cos(yw) + p.z * sin(yw), -p.x * sin(yw) + p.z * cos(yw)); n.xz = vec2(n.x * cos(yw) + n.z * sin(yw), -n.x * sin(yw) + n.z * cos(yw));
  p = p * aI2.z * vec3(1., 1. / uStretch, 1.) + aI0.xyz;                        // aI2.z: size (a little larger on the wing); a drawn-out reflection keeps the bird's own shape
  vP = p; vN = n; vC = color;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CRANE_F = COMMON + FOG_F + /* glsl */`
varying vec3 vP, vN, vC;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 col = mix(vC, vec3(dot(vC, vec3(0.3, 0.5, 0.2))), 0.3) * mix(uBounce, uSky * 0.8, clamp(n.y * 0.5 + 0.5, 0., 1.)) * mix(1., canopy(vP), 0.6);
  col = lessWash(col, 0.6);
${FINISH}}`;

// Crane state is a function of u alone (wingbeat phase is time): standing to 0.075, rising, round the island
// with the southern point of the orbit at u 0.18, down beside the lens at 0.84-0.88, landed by 0.93.
function makeCraneFlight(rng, geo, hAt) {
  // the rise: up out of the shallows of the northern tail, across the line of flight above the lens and toward
  // the far trunk, then wheeling away east and round the south of the island
  // (every point of the course near the line of flight is at least 34 m ahead of the lens when the leader
  // passes it, so the last bird, 0.01 of u behind, still passes it 15 m ahead of us)
  let keys = [0.063, 0.080, 0.093, 0.113, 0.134, 0.158, 0.19, 0.215, 0.245, 0.275, 0.31, 0.36, 0.42, 0.48, 0.56, 0.64, 0.70, 0.76, 0.80, 0.84, 0.88, 0.93];
  let curve = null;
  const setCourse = (k, pts) => { keys = k.slice(); curve = new THREE.CatmullRomCurve3(pts.map((q) => (q.isVector3 ? q.clone() : V3(q[0], q[1], q[2]))), false, 'catmullrom', 0.5); };
  setCourse(keys, [[-35, 1, 128], [-31, 9, 136], [-25, 17, 152], [-17, 27, 190], [-22, 36, 240], [-62, 36, 272], [-104, 31, 200], [-110, 26, 80], [-72, 19, -72], [0, 13, -104],
    [85, 26, -55], [95, 38, 30], [40, 45, 92], [-50, 42, 88], [-100, 36, 10], [-70, 30, -75], [10, 28, -112], [62, 26, -200], [4, 21, -318], [-37, 10.5, -262], [-38, 7, -196], [-36, 1, -68]]);
  const at = (u, out) => {
    const uc = clamp(u, keys[0], keys[keys.length - 1]); let i = 0; while (i < keys.length - 2 && uc > keys[i + 1]) i++;
    return curve.getPoint((i + (uc - keys[i]) / (keys[i + 1] - keys[i])) / (keys.length - 1), out);
  };
  // where the east shore is at northing z (the birds stand a little way out from it)
  const shoreX = (z) => { let x = -8; while (x > -60 && hAt(x, z) > -0.25) x -= 0.5; return x; };
  const birds = [];
  for (let i = 0; i < N_CRANES; i++) {
    const rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
    birds.push({ lag: rank * 0.0016 + rng.range(0, 0.0006), lat: side * rank * 2.7 + rng.range(-0.6, 0.6), up: rng.range(-1.2, 1.2) + rank * 0.25, phase: rng() * TAU,
      a: V3(0, 0.98, 142 - i * 2.6 + rng.range(-1, 1)), ya: rng() * TAU,
      b: V3(-35 + rng.range(-5, 4), 0.98, -64 - rank * 2.6 + rng.range(-1, 1)), yb: rng() * TAU });
  }
  for (const b of birds) b.a.x = shoreX(b.a.z) - 1.2 - rng.range(0, 3.2);
  const I0 = new Float32Array(N_CRANES * 4), I1 = new Float32Array(N_CRANES * 4), I2 = new Float32Array(N_CRANES * 4);
  const a0 = new THREE.InstancedBufferAttribute(I0, 4), a1 = new THREE.InstancedBufferAttribute(I1, 4), a2 = new THREE.InstancedBufferAttribute(I2, 4);
  for (const a of [a0, a1, a2]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aI0', a0); geo.setAttribute('aI1', a1); geo.setAttribute('aI2', a2); geo.instanceCount = N_CRANES;
  const p = V3(), q = V3(), q2 = V3(), wrap = (a) => a - TAU * Math.round(a / TAU);
  return {
    birds, at, setCourse, keys: () => keys.slice(),
    update(u, time) {
      for (let i = 0; i < N_CRANES; i++) {
        const b = birds[i], ui = u - b.lag;
        let yaw, pitch = 0, bank = 0, flap = 0, stand = 1, cup = 0;
        if (ui <= keys[0]) { p.copy(b.a); yaw = b.ya + 0.15 * Math.sin(time * 0.3 + i); pitch = 0.06 * Math.sin(time * 0.45 + i * 2.1); }
        else if (ui >= 0.93) { p.copy(b.b); yaw = b.yb + 0.15 * Math.sin(time * 0.3 + i); pitch = 0.06 * Math.sin(time * 0.45 + i * 2.1); }
        else {
          at(ui, p); at(ui + 0.003, q); at(ui + 0.006, q2);
          const dx = q.x - p.x, dz = q.z - p.z, dh = Math.hypot(dx, dz) + 1e-4;
          yaw = Math.atan2(dx, dz); pitch = clamp(Math.atan2(q.y - p.y, dh), -0.5, 0.6);
          bank = clamp(wrap(Math.atan2(q2.x - q.x, q2.z - q.z) - yaw) * -5, -0.5, 0.5);
          // the vee closes up for the rise (so the whole flock climbs through the middle of the frame) and again
          // when they fly in beside us; there they keep their heads north whatever the shrinking image is doing
          const esc = smoothstep(0.39, 0.44, ui) * (1 - smoothstep(0.895, 0.925, ui));
          const vee = lerp(lerp(0.42, 1, smoothstep(0.135, 0.17, ui)), 0.3, esc);
          const north = smoothstep(0.422, 0.452, ui) * (1 - smoothstep(0.875, 0.9, ui));
          yaw += wrap(-yaw) * north; pitch *= 1 - 0.8 * north; bank = lerp(bank, 0.5 * Math.sin(Math.PI * smoothstep(0.422, 0.452, ui)), north);
          p.x += (dz / dh) * b.lat * vee; p.z += (-dx / dh) * b.lat * vee; p.y += b.up;
          const k0 = keys[0], kin = smoothstep(k0, k0 + 0.022, ui), kout = smoothstep(0.895, 0.93, ui);
          p.lerpVectors(b.a, p, kin).lerp(b.b, kout);
          stand = Math.max(1 - smoothstep(k0, k0 + 0.008, ui), smoothstep(0.918, 0.93, ui));
          cup = smoothstep(0.865, 0.9, ui) * (1 - smoothstep(0.915, 0.93, ui));
          const cruise = 0.5 + 0.5 * smoothstep(-0.3, 0.5, Math.sin(ui * 60 + i * 1.7));       // stroke, then glide
          flap = lerp(lerp(0.95, 0.85 * cruise + 0.08, smoothstep(0.125, 0.21, ui)), 0.3, cup) * (1 - stand);
          yaw = lerp(yaw, yaw + wrap(b.yb - yaw), smoothstep(0.915, 0.93, ui)); yaw = lerp(b.ya + wrap(yaw - b.ya), yaw, smoothstep(k0, k0 + 0.01, ui));
          pitch *= 1 - stand;
        }
        I0[i * 4] = p.x; I0[i * 4 + 1] = p.y; I0[i * 4 + 2] = p.z; I0[i * 4 + 3] = yaw;
        I1[i * 4] = pitch; I1[i * 4 + 1] = bank; I1[i * 4 + 2] = b.phase; I1[i * 4 + 3] = flap;
        I2[i * 4] = stand; I2[i * 4 + 1] = cup; I2[i * 4 + 2] = lerp(1.38, 1.12, stand);
      }
      a0.needsUpdate = a1.needsUpdate = a2.needsUpdate = true;
    },
  };
}
